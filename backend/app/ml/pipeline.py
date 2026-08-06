"""
EVOS — ML Recommendation Pipeline
Components:
  1. Data ingestion & cleaning
  2. Feature engineering & MinMaxScaler normalization
  3. K-Means clustering (user profiling)
  4. Content-Based Filtering (cosine similarity)
  5. Explainable AI output per recommendation
"""
import numpy as np
import pandas as pd
import pickle
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from dataclasses import dataclass, field

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── DATA STRUCTURES ─────────────────────────────────────────────────────────

@dataclass
class EVRecord:
    vehicle_id: int
    manufacturer: str
    model: str
    year: int
    battery_capacity_kwh: float
    range_km: float
    charge_time_hr: float
    price_usd: float
    safety_rating: float
    autonomous_level: float
    warranty_years: float
    battery_type: str
    charging_type: str
    color: str
    cluster_id: int = -1
    cluster_label: str = ""
    feature_vector: List[float] = field(default_factory=list)


@dataclass
class RecommendationResult:
    rank: int
    ev: EVRecord
    similarity_score: float
    explanation: str
    explainability: List[Dict]


# ─── FEATURE CONFIG ───────────────────────────────────────────────────────────

FEATURE_COLUMNS = [
    "price_usd",
    "range_km",
    "battery_capacity_kwh",
    "charge_time_hr",
    "safety_rating",
    "autonomous_level",
]

FEATURE_LABELS = {
    "price_usd": "Price",
    "range_km": "Range",
    "battery_capacity_kwh": "Battery Capacity",
    "charge_time_hr": "Charge Time",
    "safety_rating": "Safety Rating",
    "autonomous_level": "Autonomy Level",
}

# Lower is better for these features (inverted during normalization)
INVERT_FEATURES = {"price_usd", "charge_time_hr"}

CLUSTER_PROFILE_MAP = {
    "budget": {"icon": "💰", "description": "Value-focused segment. Cost-efficient EVs with solid specs per dollar."},
    "performance": {"icon": "⚡", "description": "Performance segment. High-spec vehicles with advanced safety and autonomy."},
    "longrange": {"icon": "🗺️", "description": "Long-range segment. Maximum driving distance with fast charging capability."},
}


# ─── MAIN ENGINE ──────────────────────────────────────────────────────────────

class EVRecommendationEngine:
    """
    End-to-end ML pipeline for EV content-based filtering recommendations.
    
    Pipeline:
      raw CSV → clean → normalize → cluster → cosine_sim → explain
    """

    def __init__(self):
        self.records: List[EVRecord] = []
        self.feature_matrix: np.ndarray = None
        self.scaler: MinMaxScaler = MinMaxScaler()
        self.kmeans: KMeans = None
        self.cluster_label_map: Dict[int, str] = {}
        self.cluster_centroids: Dict[str, np.ndarray] = {}
        self.raw_df: pd.DataFrame = None
        self.is_ready: bool = False

    # ── 1. INITIALIZATION ───────────────────────────────────────────────────

    async def initialize(self):
        """Load data, train models, build feature matrix."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._build_pipeline)
        self.is_ready = True
        logger.info(f"✅ ML Pipeline ready: {len(self.records)} vehicles, {settings.ML_KMEANS_CLUSTERS} clusters")

    def _build_pipeline(self):
        """Synchronous pipeline construction (runs in thread pool)."""
        self._load_and_clean_data()
        self._normalize_features()
        self._run_kmeans_clustering()
        self._assign_cluster_labels()
        self._save_pipeline()

    # ── 2. DATA LOADING & CLEANING ──────────────────────────────────────────

    def _load_and_clean_data(self):
        logger.info("📊 Loading and cleaning dataset...")
        path = Path(settings.DATASET_PATH)
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found at {path}")

        df = pd.read_csv(path)

        # Normalize column names
        df.columns = [c.strip().lower().replace(" ", "_").replace("(", "").replace(")", "") for c in df.columns]

        # Rename to standard names
        rename_map = {
            "vehicle_id": "vehicle_id",
            "manufacturer": "manufacturer",
            "model": "model",
            "year": "year",
            "battery_type": "battery_type",
            "battery_capacity_kwh": "battery_capacity_kwh",
            "range_km": "range_km",
            "charging_type": "charging_type",
            "charge_time_hr": "charge_time_hr",
            "price_usd": "price_usd",
            "color": "color",
            "autonomous_level": "autonomous_level",
            "co2_emissions_g_per_km": "co2_emissions_g_per_km",
            "safety_rating": "safety_rating",
            "warranty_years": "warranty_years",
        }
        df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

        # ── Data Cleaning ──
        # Fill numeric nulls with median
        numeric_cols = ["battery_capacity_kwh", "range_km", "charge_time_hr",
                        "price_usd", "safety_rating", "autonomous_level",
                        "warranty_years", "co2_emissions_g_per_km"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                df[col] = df[col].fillna(df[col].median())

        # Fill string nulls
        for col in ["manufacturer", "model", "battery_type", "charging_type", "color"]:
            if col in df.columns:
                df[col] = df[col].fillna("Unknown")

        # Clip outliers (3-sigma rule)
        for col in ["price_usd", "range_km", "battery_capacity_kwh"]:
            if col in df.columns:
                mean, std = df[col].mean(), df[col].std()
                df[col] = df[col].clip(mean - 3 * std, mean + 3 * std)

        # Remove duplicates
        df = df.drop_duplicates(subset=["vehicle_id"] if "vehicle_id" in df.columns else None)
        df = df.reset_index(drop=True)

        self.raw_df = df
        logger.info(f"   Cleaned: {len(df)} vehicles, {df.shape[1]} features")

        # Build EVRecord objects
        self.records = []
        for _, row in df.iterrows():
            rec = EVRecord(
                vehicle_id=int(row.get("vehicle_id", 0)),
                manufacturer=str(row.get("manufacturer", "")),
                model=str(row.get("model", "")),
                year=int(row.get("year", 2020)),
                battery_capacity_kwh=float(row.get("battery_capacity_kwh", 0)),
                range_km=float(row.get("range_km", 0)),
                charge_time_hr=float(row.get("charge_time_hr", 0)),
                price_usd=float(row.get("price_usd", 0)),
                safety_rating=float(row.get("safety_rating", 3)),
                autonomous_level=float(row.get("autonomous_level", 0)),
                warranty_years=float(row.get("warranty_years", 0)),
                battery_type=str(row.get("battery_type", "Unknown")),
                charging_type=str(row.get("charging_type", "Unknown")),
                color=str(row.get("color", "Unknown")),
            )
            self.records.append(rec)

    # ── 3. FEATURE NORMALIZATION ─────────────────────────────────────────────

    def _normalize_features(self):
        logger.info("⚙️  Normalizing features with MinMaxScaler...")
        raw_matrix = np.array([
            [r.price_usd, r.range_km, r.battery_capacity_kwh,
             r.charge_time_hr, r.safety_rating, r.autonomous_level]
            for r in self.records
        ])

        # Fit scaler
        self.scaler.fit(raw_matrix)
        normalized = self.scaler.transform(raw_matrix)

        # Invert lower-is-better features
        invert_indices = [0, 3]  # price_usd (idx 0), charge_time_hr (idx 3)
        for idx in invert_indices:
            normalized[:, idx] = 1.0 - normalized[:, idx]

        self.feature_matrix = normalized

        # Attach vectors to records
        for i, rec in enumerate(self.records):
            rec.feature_vector = normalized[i].tolist()

        logger.info(f"   Feature matrix shape: {self.feature_matrix.shape}")

    # ── 4. K-MEANS CLUSTERING ────────────────────────────────────────────────

    def _run_kmeans_clustering(self):
        logger.info(f"🔬 Running K-Means (k={settings.ML_KMEANS_CLUSTERS})...")
        self.kmeans = KMeans(
            n_clusters=settings.ML_KMEANS_CLUSTERS,
            max_iter=settings.ML_KMEANS_ITERATIONS,
            random_state=settings.ML_KMEANS_RANDOM_STATE,
            n_init=10,
        )
        labels = self.kmeans.fit_predict(self.feature_matrix)

        for i, rec in enumerate(self.records):
            rec.cluster_id = int(labels[i])

        logger.info(f"   Inertia: {self.kmeans.inertia_:.2f}")

    def _assign_cluster_labels(self):
        """Map cluster IDs to semantic labels based on centroid characteristics."""
        logger.info("🏷️  Assigning cluster labels...")
        k = settings.ML_KMEANS_CLUSTERS
        centroids = self.kmeans.cluster_centers_

        # Feature indices: [price(inv), range, battery, charge(inv), safety, auto]
        cluster_stats = {}
        for cid in range(k):
            members = [r for r in self.records if r.cluster_id == cid]
            cluster_stats[cid] = {
                "avg_price": np.mean([m.price_usd for m in members]),
                "avg_range": np.mean([m.range_km for m in members]),
                "avg_battery": np.mean([m.battery_capacity_kwh for m in members]),
                "avg_safety": np.mean([m.safety_rating for m in members]),
                "avg_autonomy": np.mean([m.autonomous_level for m in members]),
                "count": len(members),
                "centroid": centroids[cid].tolist(),
            }

        # Assign labels by dominant characteristic
        cids = list(range(k))

        # Budget: lowest avg price
        budget_id = min(cids, key=lambda c: cluster_stats[c]["avg_price"])

        # Long-range: highest avg range (excluding budget)
        remaining = [c for c in cids if c != budget_id]
        longrange_id = max(remaining, key=lambda c: cluster_stats[c]["avg_range"])

        # Performance: the rest
        perf_id = [c for c in cids if c not in (budget_id, longrange_id)][0]

        self.cluster_label_map = {
            budget_id: "budget",
            longrange_id: "longrange",
            perf_id: "performance",
        }

        # Assign labels to records
        for rec in self.records:
            rec.cluster_label = self.cluster_label_map[rec.cluster_id]

        # Store centroids by label
        for cid, label in self.cluster_label_map.items():
            self.cluster_centroids[label] = np.array(cluster_stats[cid]["centroid"])

        # Log distribution
        for cid, stats in cluster_stats.items():
            label = self.cluster_label_map[cid]
            logger.info(
                f"   Cluster {cid} [{label}]: {stats['count']} vehicles | "
                f"avg_price=${stats['avg_price']:,.0f} | avg_range={stats['avg_range']:.0f}km"
            )

    # ── 5. COSINE SIMILARITY RECOMMENDATION ─────────────────────────────────

    def recommend(
        self,
        preferences: Dict,
        weights: Dict,
        cluster_profile: str = "performance",
        top_k: int = 5,
    ) -> Tuple[List[RecommendationResult], Dict]:
        """
        Core recommendation engine.
        
        Args:
            preferences: dict with max_price_usd, min_range_km, etc.
            weights: feature importance weights
            cluster_profile: 'budget' | 'performance' | 'longrange'
            top_k: number of recommendations to return

        Returns:
            List of RecommendationResult + metadata dict
        """
        if not self.is_ready:
            raise RuntimeError("ML Engine not initialized")

        # Build weight vector (aligned to FEATURE_COLUMNS)
        w = np.array([
            weights.get("price", 1.0),
            weights.get("range_km", 1.5),
            weights.get("battery", 1.0),
            weights.get("charge_time", 1.0),
            weights.get("safety", 1.0),
            weights.get("autonomy", 1.5),
        ])

        # Build user preference vector
        raw_user = np.array([[
            preferences["max_price_usd"],
            preferences["min_range_km"],
            preferences["min_battery_kwh"],
            preferences["max_charge_time_hr"],
            preferences["min_safety_rating"],
            preferences["min_autonomy_level"],
        ]])
        user_norm = self.scaler.transform(raw_user)[0]
        # Invert lower-is-better features
        user_norm[0] = 1.0 - user_norm[0]  # price
        user_norm[3] = 1.0 - user_norm[3]  # charge time

        # Apply weights
        user_vec_weighted = user_norm * w

        # ── Hard filter (strict, no fallback) ──
        def passes_filter(r: EVRecord) -> bool:
            price_ok   = r.price_usd        <= preferences["max_price_usd"]
            range_ok   = r.range_km         >= preferences["min_range_km"]
            battery_ok = r.battery_capacity_kwh >= preferences["min_battery_kwh"]
            safety_ok  = r.safety_rating    >= preferences["min_safety_rating"]
            charge_ok  = r.charge_time_hr   <= preferences["max_charge_time_hr"]
            auto_ok    = r.autonomous_level >= preferences["min_autonomy_level"]
            return price_ok and range_ok and battery_ok and safety_ok and charge_ok and auto_ok

        pool = [r for r in self.records if passes_filter(r)]
        logger.info(f"🔍 Filter result: {len(pool)} vehicles passed out of {len(self.records)}")
        logger.info(f"   Preferences: price<={preferences['max_price_usd']}, range>={preferences['min_range_km']}, battery>={preferences['min_battery_kwh']}, charge<={preferences['max_charge_time_hr']}, safety>={preferences['min_safety_rating']}, auto>={preferences['min_autonomy_level']}")

        # Kalau kosong → return no results
        if len(pool) == 0:
            return [], {
                "user_vector":       user_vec_weighted.tolist(),
                "total_evaluated":   len(self.records),
                "filtered_pool":     0,
                "cluster_label":     cluster_profile,
                "cluster_description": CLUSTER_PROFILE_MAP.get(
                    cluster_profile, {}
                ).get("description", ""),
            }

        # ── Cluster boost: give slight boost to matching cluster ──
        pool_indices = [self.records.index(r) for r in pool]
        pool_matrix = self.feature_matrix[pool_indices] * w  # weighted

        # Compute cosine similarity
        user_vec_2d = user_vec_weighted.reshape(1, -1)
        similarities = cosine_similarity(user_vec_2d, pool_matrix)[0]

        # Cluster affinity bonus (5%)
        for i, rec in enumerate(pool):
            if rec.cluster_label == cluster_profile:
                similarities[i] = min(1.0, similarities[i] * 1.05)

        # Sort and take top-k
        sorted_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for rank, idx in enumerate(sorted_indices, 1):
            rec = pool[idx]
            sim = float(similarities[idx])
            explain_details = self._explain(rec, user_norm, w, preferences)
            explanation_text = self._generate_explanation_text(rec, preferences, explain_details)

            results.append(RecommendationResult(
                rank=rank,
                ev=rec,
                similarity_score=round(sim, 4),
                explanation=explanation_text,
                explainability=explain_details,
            ))

        metadata = {
            "user_vector": user_vec_weighted.tolist(),
            "total_evaluated": len(self.records),
            "filtered_pool": len(pool),
            "cluster_label": cluster_profile,
            "cluster_description": CLUSTER_PROFILE_MAP.get(cluster_profile, {}).get("description", ""),
        }

        return results, metadata

    # ── 6. EXPLAINABLE AI ────────────────────────────────────────────────────

    def _explain(
        self,
        rec: EVRecord,
        user_norm: np.ndarray,
        weights: np.ndarray,
        preferences: Dict,
    ) -> List[Dict]:
        """Generate per-feature explainability breakdown."""
        ev_norm = np.array(rec.feature_vector)
        feature_names = ["price_usd", "range_km", "battery_capacity_kwh",
                         "charge_time_hr", "safety_rating", "autonomous_level"]
        user_raw = [
            preferences["max_price_usd"],
            preferences["min_range_km"],
            preferences["min_battery_kwh"],
            preferences["max_charge_time_hr"],
            preferences["min_safety_rating"],
            preferences["min_autonomy_level"],
        ]
        ev_raw = [
            rec.price_usd, rec.range_km, rec.battery_capacity_kwh,
            rec.charge_time_hr, rec.safety_rating, rec.autonomous_level,
        ]

        details = []
        for i, fname in enumerate(feature_names):
            u = float(user_norm[i])
            v = float(ev_norm[i])
            diff = abs(u - v)
            contribution = float(weights[i] * (1.0 - diff))

            if diff < 0.1:
                quality = "excellent"
            elif diff < 0.25:
                quality = "good"
            elif diff < 0.4:
                quality = "partial"
            else:
                quality = "weak"

            details.append({
                "feature": FEATURE_LABELS[fname],
                "user_value": round(user_raw[i], 2),
                "vehicle_value": round(ev_raw[i], 2),
                "normalized_user": round(u, 4),
                "normalized_vehicle": round(v, 4),
                "weight": round(float(weights[i]), 2),
                "contribution": round(contribution, 4),
                "match_quality": quality,
            })

        return details

    def _generate_explanation_text(
        self,
        rec: EVRecord,
        preferences: Dict,
        details: List[Dict],
    ) -> str:
        """Human-readable explanation of why a vehicle was recommended."""
        excellent = [d["feature"] for d in details if d["match_quality"] == "excellent"]
        good = [d["feature"] for d in details if d["match_quality"] == "good"]

        strong = (excellent + good)[:3]

        if strong:
            reason = f"Recommended because of strong alignment in: {', '.join(strong).lower()}."
        else:
            reason = "Recommended as the closest overall match to your preferences."

        if rec.price_usd <= preferences["max_price_usd"]:
            reason += f" Priced within your budget at ${rec.price_usd:,.0f}."
        if rec.range_km >= preferences["min_range_km"]:
            reason += f" Delivers {rec.range_km} km range meeting your minimum."
        if rec.safety_rating >= preferences["min_safety_rating"]:
            reason += f" Safety rated {rec.safety_rating}/5."

        return reason

    # ── 7. CLUSTER ANALYTICS ─────────────────────────────────────────────────

    def get_cluster_stats(self) -> List[Dict]:
        """Return per-cluster statistics for the /clusters endpoint."""
        stats = []
        for cid in range(settings.ML_KMEANS_CLUSTERS):
            label = self.cluster_label_map.get(cid, "unknown")
            members = [r for r in self.records if r.cluster_id == cid]
            if not members:
                continue

            # Pick 3 representative vehicles (closest to centroid)
            centroid = self.kmeans.cluster_centers_[cid]
            m_indices = [self.records.index(m) for m in members]
            m_vecs = self.feature_matrix[m_indices]
            dists = np.linalg.norm(m_vecs - centroid, axis=1)
            rep_idx = np.argsort(dists)[:3]
            representatives = [members[i] for i in rep_idx]

            stats.append({
                "cluster_id": cid,
                "cluster_label": label,
                "description": CLUSTER_PROFILE_MAP.get(label, {}).get("description", ""),
                "vehicle_count": len(members),
                "avg_price": round(np.mean([m.price_usd for m in members]), 2),
                "avg_range": round(np.mean([m.range_km for m in members]), 2),
                "avg_battery": round(np.mean([m.battery_capacity_kwh for m in members]), 2),
                "avg_charge_time": round(np.mean([m.charge_time_hr for m in members]), 2),
                "avg_safety": round(np.mean([m.safety_rating for m in members]), 2),
                "avg_autonomy": round(np.mean([m.autonomous_level for m in members]), 2),
                "representative_vehicles": representatives,
                "centroid": self.kmeans.cluster_centers_[cid].tolist(),
            })

        return stats

    # ── 8. PERSISTENCE ───────────────────────────────────────────────────────

    def _save_pipeline(self):
        path = Path(settings.ML_MODEL_PATH)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "scaler": self.scaler,
            "kmeans": self.kmeans,
            "cluster_label_map": self.cluster_label_map,
            "feature_matrix": self.feature_matrix,
        }
        with open(path, "wb") as f:
            pickle.dump(payload, f)
        logger.info(f"   Pipeline saved → {path}")

    def load_pipeline(self):
        path = Path(settings.ML_MODEL_PATH)
        if not path.exists():
            raise FileNotFoundError(f"No saved pipeline at {path}")
        with open(path, "rb") as f:
            payload = pickle.load(f)
        self.scaler = payload["scaler"]
        self.kmeans = payload["kmeans"]
        self.cluster_label_map = payload["cluster_label_map"]
        self.feature_matrix = payload["feature_matrix"]
        logger.info("   Pipeline loaded from disk.")
