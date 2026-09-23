<div align="center">

# ⚡ EVOS
### Electric Vehicle Oracle System

*AI-powered EV recommendations that explain themselves — content-based filtering, K-Means clustering, and explainable AI over 3,022 real vehicle records.*

![Python](https://img.shields.io/badge/python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

</div>

---

## 📌 Overview

EVOS is a full-stack web application that helps users choose an electric vehicle based on their own priorities — not a generic spec filter, but a recommendation engine that ranks vehicles against what *you* actually care about, and explains exactly why each result was picked.

## ❗ Problem

Choosing an EV means weighing trade-offs across price, range, battery capacity, charging time, and safety — across a market with hundreds of models. Most comparison tools let you filter by spec, but they don't explain *why* a vehicle actually fits your needs, and they don't account for how different buyer priorities (budget-focused vs. performance-focused vs. range-focused) change what "best fit" even means.

## 💡 Solution

EVOS combines **K-Means clustering** (to group vehicles into buyer-oriented profiles) with **content-based filtering via cosine similarity** (to rank vehicles against a user's specific preferences). Every recommendation is paired with an **Explainable AI breakdown** showing exactly which features drove the match, instead of a black-box score.

## ✨ Key Features

| | |
|---|---|
| 🎯 **Preference-based matching** | Set your own budget, range, battery, charge time, safety, and autonomy priorities via weighted sliders |
| 🧭 **3 buyer profiles** | K-Means clustering into **Budget**, **Performance**, and **Long Range** segments |
| 🔍 **Explainable AI** | Every recommendation shows a per-feature contribution score and match quality (excellent/good/partial/weak) — not just a similarity number |
| ⚖️ **Side-by-side comparison** | Compare up to 3 vehicles at once, with the best value per spec highlighted automatically |
| ❤️ **Save & bookmark** | Save vehicles to revisit and compare later |
| 📡 **Full REST API** | FastAPI backend with interactive Swagger docs at `/docs` |
| 🐳 **One-command deploy** | Fully Dockerized — PostgreSQL + FastAPI + React/Nginx via Docker Compose |

## 📊 Dataset

- **3,022** electric vehicle records
- **53** manufacturers
- **40** production countries
- Model years **2015–2025**
- 6 core features used for recommendation: price, range, battery capacity, charge time, safety rating, autonomy level

## 📸 Screenshots

**Homepage**
![Homepage](zhomepage.png)

**Preference Form** — weighted sliders drive the recommendation engine
![Preference Form](zpreference-form.png)

**Recommendations — Explainable AI radar + feature breakdown**
![Recommendations](zrecommendation.png)

**Side-by-Side EV Comparison** — best value per spec auto-highlighted
![Comparison](zcompared.png)

**Saved Vehicles**
![Saved](zsaved.png)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     EVOS System Architecture                 │
├──────────────┬─────────────────────────┬────────────────────┤
│   FRONTEND   │       BACKEND API        │     DATABASE       │
│              │                          │                    │
│  React.js    │  FastAPI (Python 3.11)   │  PostgreSQL 16     │
│  TailwindCSS │  ┌───────────────────┐   │  ┌──────────────┐ │
│  GSAP        │  │  ML Pipeline      │   │  │ ev_vehicles  │ │
│  Particles   │  │  ├ MinMaxScaler   │   │  │ user_sessions│ │
│              │  │  ├ K-Means (k=3)  │   │  │ rec_logs     │ │
│  ─────────   │  │  ├ CosineSim      │   │  │ cluster_prof │ │
│  POST /rec   │  │  └ Explainability │   │  └──────────────┘ │
│  GET /evs    │  └───────────────────┘   │                    │
│  GET /clust  │                          │                    │
└──────────────┴─────────────────────────┴────────────────────┘
```

## 📁 Folder Structure

```
evos/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── core/
│       │   ├── config.py          # Pydantic settings
│       │   └── database.py        # Async SQLAlchemy engine
│       ├── api/
│       │   ├── recommend.py       # POST /recommend
│       │   ├── vehicles.py        # GET /vehicles
│       │   ├── clusters.py        # GET /clusters
│       │   └── health.py          # GET /health
│       ├── ml/
│       │   └── pipeline.py        # Full ML pipeline (★ core)
│       ├── models/
│       │   └── ev_models.py       # SQLAlchemy ORM models
│       └── schemas/
│           └── schemas.py         # Pydantic request/response schemas
├── frontend/
│   ├── index.html                 # GSAP CDN loaded here
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles/globals.css     # Cinematic dark theme
│       ├── components/
│       │   ├── Hero.jsx           # Animated hero section
│       │   ├── ParticleCanvas.jsx # WebGL-like particle system
│       │   ├── ClusterBadge.jsx   # K-Means profile selector
│       │   ├── PreferenceForm.jsx # Slider-based preference input
│       │   └── ResultsPanel.jsx   # Cards + similarity + explainability
│       ├── hooks/
│       │   └── useGSAP.js         # GSAP ScrollTrigger integration
│       └── utils/
│           └── api.js             # Fetch wrapper for FastAPI
├── database/
│   └── schema.sql                 # PostgreSQL schema + views + triggers
├── tests/
│   └── evos_api_tests.postman_collection.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🤖 ML Pipeline Details

### 1. Data Processing
- Load CSV → normalize column names → fill nulls with median → clip 3-sigma outliers
- Features: `price_usd`, `range_km`, `battery_capacity_kwh`, `charge_time_hr`, `safety_rating`, `autonomous_level`

### 2. Feature Scaling (MinMaxScaler)
- Each feature normalized to [0, 1]
- **Inverted** for lower-is-better: `price_usd` → `1 - norm`, `charge_time_hr` → `1 - norm`

### 3. K-Means Clustering (User Profiling)
- `k=3`, `max_iter=300`, `n_init=10`, `random_state=42`
- Cluster assignment by semantic dominance:
  - **Cluster A (Budget)**: lowest avg_price
  - **Cluster B (Performance)**: balanced high-spec
  - **Cluster C (Long Range)**: highest avg_range

### 4. Content-Based Filtering (Cosine Similarity)
```
similarity = (user_vec · ev_vec) / (||user_vec|| × ||ev_vec||)
```
- User vector built from slider inputs → MinMaxScaler → weighted
- Per-feature weights (×0.5 to ×2.0) adjust importance
- Cluster affinity bonus: +5% for matching cluster profile
- Hard filters applied first (relaxed ±20-25% for coverage)
- Returns TOP-K sorted by descending similarity

### 5. Explainable AI
Each recommendation includes:
- **Similarity %** (cosine score)
- **Explanation text**: "Recommended because of strong alignment in: range, battery capacity, safety rating."
- **Feature breakdown**: per-feature contribution, match quality (excellent/good/partial/weak), user vs. vehicle values

---

## 🚀 Quick Start

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone & enter project
git clone https://github.com/yourname/evos.git
cd evos

# 2. Add your dataset
cp /path/to/electric_vehicles_dataset.csv data/

# 3. Set env variables
cp .env.example .env

# 4. Launch all services
docker compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option B: Local Development

#### Backend
```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL
psql -U postgres -c "CREATE USER evos_user WITH PASSWORD 'evos_pass';"
psql -U postgres -c "CREATE DATABASE evos_db OWNER evos_user;"
psql -U evos_user -d evos_db -f ../database/schema.sql

# Copy dataset
mkdir -p data && cp /path/to/electric_vehicles_dataset.csv data/

# Create .env
cp ../.env.example .env

# Run backend (auto-trains ML model on startup)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend

# Install
npm install

# Run dev server
npm run dev
# → http://localhost:3000
```

---

## 🔗 API Reference

### `POST /recommend`
```json
{
  "max_price_usd": 95000,
  "min_range_km": 350,
  "min_battery_kwh": 80,
  "max_charge_time_hr": 6.0,
  "min_safety_rating": 4,
  "min_autonomy_level": 3,
  "cluster_profile": "performance",
  "top_k": 5,
  "weights": {
    "price": 1.0,
    "range_km": 1.5,
    "battery": 1.0,
    "charge_time": 1.0,
    "safety": 1.0,
    "autonomy": 1.5
  }
}
```

**Response:**
```json
{
  "session_token": "uuid",
  "cluster_label": "performance",
  "cluster_description": "...",
  "total_vehicles_evaluated": 3022,
  "filtered_pool_size": 420,
  "processing_time_ms": 18.4,
  "recommendations": [
    {
      "rank": 1,
      "similarity_score": 0.9742,
      "similarity_pct": "97.4%",
      "explanation": "Recommended because of strong alignment in: range, battery capacity, safety rating. Priced within your budget at $82,498.",
      "explainability": [
        { "feature": "Range", "user_value": 350, "vehicle_value": 527, "match_quality": "excellent", "contribution": 0.89 },
        ...
      ],
      "vehicle": { "manufacturer": "Maserati", "model": "GranTurismo Folgore", ... }
    }
  ]
}
```

### `GET /vehicles`
Query params: `page`, `page_size`, `manufacturer`, `min_price`, `max_price`, `min_range`, `cluster`, `sort_by`, `sort_dir`

### `GET /clusters`
Returns K-Means cluster profiles with statistics and representative vehicles.

### `GET /health`
Returns system health, ML engine status, loaded vehicle count.

---

## 🧪 Testing

### Postman
```bash
# Import the collection
tests/evos_api_tests.postman_collection.json
# Set BASE_URL = http://localhost:8000
# Run all tests
```

### Sample Inputs & Expected Outputs

| Profile     | Budget  | Range  | Battery | Expected Top Result         |
|-------------|---------|--------|---------|------------------------------|
| Budget      | $50k    | 250 km | 50 kWh  | Nissan Leaf / Rimac Nevera   |
| Performance | $95k    | 350 km | 80 kWh  | Maserati / Lucid Motors      |
| Long Range  | $85k    | 470 km | 100 kWh | Faraday Future / Canoo       |

---

## 🌍 Production Deployment

### AWS / GCP / Azure
```bash
# Build images
docker compose build

# Tag & push to registry
docker tag evos_backend your-registry/evos-backend:v1.0
docker tag evos_frontend your-registry/evos-frontend:v1.0
docker push your-registry/evos-backend:v1.0
docker push your-registry/evos-frontend:v1.0

# Deploy with Kubernetes or ECS
# Use managed PostgreSQL (RDS / Cloud SQL)
# Use persistent volume for ML models
```

### Environment Variables (Production)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@managed-db-host:5432/evos_db
DEBUG=false
ALLOWED_ORIGINS=["https://evos.yourdomain.com"]
ML_KMEANS_CLUSTERS=3
```

---

## 📊 Tech Stack

| Layer        | Technology                            |
|--------------|---------------------------------------|
| Frontend     | React 18, Vite, GSAP, Canvas API      |
| Backend      | FastAPI, Python 3.11, Uvicorn         |
| ML           | scikit-learn, pandas, numpy           |
| Database     | PostgreSQL 16, SQLAlchemy async       |
| Container    | Docker, Docker Compose, Nginx         |
| API Docs     | Swagger UI at `/docs`                 |

---

## 📄 License
MIT — Free to use, modify, and distribute.
