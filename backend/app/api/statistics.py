"""
EVOS — Statistics & PCA Endpoint
"""
import numpy as np
import random
from collections import Counter
from fastapi import APIRouter, Request, HTTPException
from sklearn.decomposition import PCA

router = APIRouter()


@router.get("/overview")
async def get_statistics(request: Request):
    ml = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    records = ml.records

    # ── Price Distribution (histogram bins) ──
    prices = [r.price_usd for r in records]
    bins = list(range(30000, 160000, 10000))
    price_dist = []
    for i in range(len(bins) - 1):
        count = sum(1 for p in prices if bins[i] <= p < bins[i + 1])
        price_dist.append({
            "range": f"${bins[i]//1000}k-${bins[i+1]//1000}k",
            "count": count
        })

    # ── Top 10 Manufacturers ──
    mfr_counts = Counter(r.manufacturer for r in records)
    top_manufacturers = [
        {"name": k, "count": v}
        for k, v in mfr_counts.most_common(10)
    ]

    # ── Charging Type Distribution ──
    charge_counts = Counter(r.charging_type for r in records)
    charging_types = [
        {"type": k, "count": v}
        for k, v in charge_counts.most_common(8)
    ]

    # ── Avg Range per Cluster ──
    cluster_range = []
    for label in ["budget", "performance", "longrange"]:
        members = [r for r in records if r.cluster_label == label]
        if members:
            cluster_range.append({
                "cluster": label.capitalize(),
                "avg_range": round(np.mean([m.range_km for m in members]), 1),
                "avg_price": round(np.mean([m.price_usd for m in members]), 0),
                "avg_battery": round(np.mean([m.battery_capacity_kwh for m in members]), 1),
                "count": len(members)
            })

    # ── Range vs Battery scatter (sample 300) ──
    sample = random.sample(records, min(300, len(records)))
    range_battery = [
        {
            "range_km": r.range_km,
            "battery_kwh": r.battery_capacity_kwh,
            "price": r.price_usd,
            "cluster": r.cluster_label,
            "name": f"{r.manufacturer} {r.model}"
        }
        for r in sample
    ]

    # ── Summary Stats ──
    summary = {
        "total_vehicles": len(records),
        "avg_price": round(np.mean(prices), 0),
        "avg_range": round(np.mean([r.range_km for r in records]), 1),
        "avg_battery": round(np.mean([r.battery_capacity_kwh for r in records]), 1),
        "manufacturers_count": len(set(r.manufacturer for r in records)),
        "price_min": round(min(prices), 0),
        "price_max": round(max(prices), 0),
    }

    return {
        "summary": summary,
        "price_distribution": price_dist,
        "top_manufacturers": top_manufacturers,
        "charging_types": charging_types,
        "cluster_stats": cluster_range,
        "range_battery_scatter": range_battery,
    }


@router.get("/pca3d")
async def get_pca_3d(request: Request):
    """PCA 3D — reduksi 6 dimensi ke 3 komponen untuk visualisasi."""
    ml = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    # Run PCA 3 components
    pca = PCA(n_components=3, random_state=42)
    coords = pca.fit_transform(ml.feature_matrix)

    explained = pca.explained_variance_ratio_

    # Build response
    points = []
    for i, rec in enumerate(ml.records):
        points.append({
            "x": round(float(coords[i, 0]), 4),
            "y": round(float(coords[i, 1]), 4),
            "z": round(float(coords[i, 2]), 4),
            "cluster": rec.cluster_label,
            "name": f"{rec.manufacturer} {rec.model}",
            "price": rec.price_usd,
            "range_km": rec.range_km,
            "battery": rec.battery_capacity_kwh,
            "vehicle_id": rec.vehicle_id,
        })

    return {
        "points": points,
        "explained_variance": {
            "pc1": round(float(explained[0]) * 100, 1),
            "pc2": round(float(explained[1]) * 100, 1),
            "pc3": round(float(explained[2]) * 100, 1),
            "total": round(float(sum(explained)) * 100, 1),
        },
        "feature_names": [
            "Price (inv)", "Range", "Battery",
            "Charge Time (inv)", "Safety", "Autonomy"
        ],
        "loadings": pca.components_.tolist(),
    }

@router.get("/elbow")
async def get_elbow_data(request: Request):
    """Elbow Method — justifikasi pemilihan k=3."""
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score, silhouette_samples

    ml = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    X = ml.feature_matrix
    k_range = range(2, 9)
    inertias = []
    sil_scores = []

    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=100)
        labels = km.fit_predict(X)
        inertias.append(round(float(km.inertia_), 2))
        sil = silhouette_score(X, labels)
        sil_scores.append(round(float(sil), 4))

    # Silhouette per cluster untuk k=3 (yang dipakai)
    labels_3 = ml.kmeans.labels_
    sil_samples = silhouette_samples(X, labels_3)

    cluster_sil = {}
    for cid, label in ml.cluster_label_map.items():
        mask = labels_3 == cid
        cluster_sil[label] = round(float(sil_samples[mask].mean()), 4)

    overall_sil = round(float(silhouette_score(X, labels_3)), 4)

    return {
        "elbow": {
            "k_values":  list(k_range),
            "inertias":  inertias,
            "sil_scores": sil_scores,
            "optimal_k": 3,
        },
        "silhouette": {
            "overall": overall_sil,
            "per_cluster": cluster_sil,
            "interpretation": (
                "Excellent" if overall_sil > 0.7
                else "Good" if overall_sil > 0.5
                else "Fair" if overall_sil > 0.25
                else "Poor"
            ),
        },
    }