-- ============================================================
-- EVOS — PostgreSQL Database Schema
-- Electric Vehicle Oracle System
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ─── TABLE: electric_vehicles ────────────────────────────────
CREATE TABLE IF NOT EXISTS electric_vehicles (
    id                      SERIAL PRIMARY KEY,
    vehicle_id              INTEGER UNIQUE NOT NULL,
    manufacturer            VARCHAR(100) NOT NULL,
    model                   VARCHAR(200) NOT NULL,
    year                    INTEGER NOT NULL CHECK (year BETWEEN 1990 AND 2030),

    -- Battery & Range
    battery_type            VARCHAR(100),
    battery_capacity_kwh    NUMERIC(6,2) NOT NULL CHECK (battery_capacity_kwh > 0),
    range_km                INTEGER NOT NULL CHECK (range_km > 0),
    charging_type           VARCHAR(100),
    charge_time_hr          NUMERIC(5,2) NOT NULL CHECK (charge_time_hr >= 0),

    -- Market
    price_usd               NUMERIC(10,2) NOT NULL CHECK (price_usd > 0),
    color                   VARCHAR(100),
    country_of_manufacture  VARCHAR(100),

    -- Technology
    autonomous_level        NUMERIC(3,1) DEFAULT 0 CHECK (autonomous_level BETWEEN 0 AND 5),
    co2_emissions_g_per_km  NUMERIC(6,2) DEFAULT 0,
    safety_rating           NUMERIC(3,1) CHECK (safety_rating BETWEEN 1 AND 5),
    units_sold_2024         INTEGER DEFAULT 0,
    warranty_years          INTEGER DEFAULT 0,

    -- ML outputs
    cluster_id              INTEGER,
    cluster_label           VARCHAR(50),
    feature_vector          JSONB,

    -- Audit
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS ix_ev_manufacturer    ON electric_vehicles (manufacturer);
CREATE INDEX IF NOT EXISTS ix_ev_price           ON electric_vehicles (price_usd);
CREATE INDEX IF NOT EXISTS ix_ev_range           ON electric_vehicles (range_km);
CREATE INDEX IF NOT EXISTS ix_ev_battery         ON electric_vehicles (battery_capacity_kwh);
CREATE INDEX IF NOT EXISTS ix_ev_cluster         ON electric_vehicles (cluster_id);
CREATE INDEX IF NOT EXISTS ix_ev_cluster_label   ON electric_vehicles (cluster_label);
CREATE INDEX IF NOT EXISTS ix_ev_year            ON electric_vehicles (year);

-- Full-text search on manufacturer + model
CREATE INDEX IF NOT EXISTS ix_ev_fulltext
    ON electric_vehicles USING gin(to_tsvector('english', manufacturer || ' ' || model));

-- ─── TABLE: user_sessions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id                      SERIAL PRIMARY KEY,
    session_token           VARCHAR(64) UNIQUE NOT NULL,
    cluster_label           VARCHAR(50),

    -- Preferences snapshot
    pref_max_price          NUMERIC(10,2),
    pref_min_range          NUMERIC(6,1),
    pref_min_battery        NUMERIC(6,2),
    pref_max_charge_time    NUMERIC(5,2),
    pref_min_safety         NUMERIC(3,1),
    pref_min_autonomy       NUMERIC(3,1),
    feature_weights         JSONB,

    -- Session metadata
    ip_address              VARCHAR(50),
    user_agent              TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    last_active             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_session_token  ON user_sessions (session_token);
CREATE INDEX IF NOT EXISTS ix_session_cluster ON user_sessions (cluster_label);
CREATE INDEX IF NOT EXISTS ix_session_created ON user_sessions (created_at);

-- ─── TABLE: recommendation_logs ──────────────────────────────
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id                  SERIAL PRIMARY KEY,
    session_id          INTEGER REFERENCES user_sessions(id) ON DELETE SET NULL,
    vehicle_id          INTEGER REFERENCES electric_vehicles(id) ON DELETE SET NULL,

    rank                SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 20),
    similarity_score    NUMERIC(7,6) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
    explanation_text    TEXT,

    -- Snapshot at time of recommendation
    user_preferences    JSONB,
    feature_weights     JSONB,
    cluster_label       VARCHAR(50),

    -- User feedback
    was_clicked         BOOLEAN DEFAULT FALSE,
    was_helpful         BOOLEAN,

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_rec_session   ON recommendation_logs (session_id);
CREATE INDEX IF NOT EXISTS ix_rec_vehicle   ON recommendation_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_rec_created   ON recommendation_logs (created_at);
CREATE INDEX IF NOT EXISTS ix_rec_score     ON recommendation_logs (similarity_score DESC);

-- ─── TABLE: cluster_profiles ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cluster_profiles (
    id              SERIAL PRIMARY KEY,
    cluster_id      INTEGER UNIQUE NOT NULL,
    cluster_label   VARCHAR(50) NOT NULL,
    description     TEXT,

    -- Centroid statistics
    avg_price       NUMERIC(10,2),
    avg_range       NUMERIC(6,1),
    avg_battery     NUMERIC(6,2),
    avg_charge_time NUMERIC(5,2),
    avg_safety      NUMERIC(3,1),
    avg_autonomy    NUMERIC(3,1),
    vehicle_count   INTEGER,

    centroid_vector JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VIEWS ────────────────────────────────────────────────────

-- Most recommended vehicles
CREATE OR REPLACE VIEW vw_top_recommended AS
SELECT
    ev.manufacturer,
    ev.model,
    ev.year,
    COUNT(rl.id)                        AS recommendation_count,
    AVG(rl.similarity_score)            AS avg_similarity,
    SUM(CASE WHEN rl.was_helpful THEN 1 ELSE 0 END) AS helpful_count,
    ev.price_usd,
    ev.range_km,
    ev.cluster_label
FROM recommendation_logs rl
JOIN electric_vehicles ev ON rl.vehicle_id = ev.id
GROUP BY ev.id, ev.manufacturer, ev.model, ev.year, ev.price_usd, ev.range_km, ev.cluster_label
ORDER BY recommendation_count DESC;

-- Cluster usage stats
CREATE OR REPLACE VIEW vw_cluster_usage AS
SELECT
    cluster_label,
    COUNT(*)            AS session_count,
    AVG(pref_max_price) AS avg_budget,
    AVG(pref_min_range) AS avg_min_range,
    MIN(created_at)     AS first_seen,
    MAX(last_active)    AS last_seen
FROM user_sessions
WHERE cluster_label IS NOT NULL
GROUP BY cluster_label;

-- ─── TRIGGERS ─────────────────────────────────────────────────

-- Auto-update updated_at on electric_vehicles
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ev_updated
    BEFORE UPDATE ON electric_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ─── SEED DATA: cluster_profiles ─────────────────────────────
INSERT INTO cluster_profiles (cluster_id, cluster_label, description)
VALUES
    (0, 'budget',      'Value-focused segment. Cost-efficient EVs with solid specs per dollar.'),
    (1, 'performance', 'Performance segment. High-spec vehicles with advanced safety and autonomy.'),
    (2, 'longrange',   'Long-range segment. Maximum driving distance with fast charging capability.')
ON CONFLICT (cluster_id) DO NOTHING;
