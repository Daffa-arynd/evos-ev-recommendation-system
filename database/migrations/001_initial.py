"""Initial migration - create all EVOS tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-05-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # electric_vehicles
    op.create_table(
        'electric_vehicles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('vehicle_id', sa.Integer, unique=True, nullable=False),
        sa.Column('manufacturer', sa.String(100), nullable=False),
        sa.Column('model', sa.String(200), nullable=False),
        sa.Column('year', sa.Integer, nullable=False),
        sa.Column('battery_type', sa.String(100)),
        sa.Column('battery_capacity_kwh', sa.Float, nullable=False),
        sa.Column('range_km', sa.Integer, nullable=False),
        sa.Column('charging_type', sa.String(100)),
        sa.Column('charge_time_hr', sa.Float, nullable=False),
        sa.Column('price_usd', sa.Float, nullable=False),
        sa.Column('color', sa.String(100)),
        sa.Column('country_of_manufacture', sa.String(100)),
        sa.Column('autonomous_level', sa.Float, default=0),
        sa.Column('co2_emissions_g_per_km', sa.Float, default=0),
        sa.Column('safety_rating', sa.Float),
        sa.Column('units_sold_2024', sa.Integer, default=0),
        sa.Column('warranty_years', sa.Integer, default=0),
        sa.Column('cluster_id', sa.Integer),
        sa.Column('cluster_label', sa.String(50)),
        sa.Column('feature_vector', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ev_manufacturer', 'electric_vehicles', ['manufacturer'])
    op.create_index('ix_ev_price', 'electric_vehicles', ['price_usd'])
    op.create_index('ix_ev_range', 'electric_vehicles', ['range_km'])
    op.create_index('ix_ev_cluster', 'electric_vehicles', ['cluster_id'])

    # user_sessions
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_token', sa.String(64), unique=True, nullable=False),
        sa.Column('cluster_label', sa.String(50)),
        sa.Column('pref_max_price', sa.Float),
        sa.Column('pref_min_range', sa.Float),
        sa.Column('pref_min_battery', sa.Float),
        sa.Column('pref_max_charge_time', sa.Float),
        sa.Column('pref_min_safety', sa.Float),
        sa.Column('pref_min_autonomy', sa.Float),
        sa.Column('feature_weights', JSONB),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('user_agent', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_active', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # recommendation_logs
    op.create_table(
        'recommendation_logs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_id', sa.Integer, sa.ForeignKey('user_sessions.id', ondelete='SET NULL')),
        sa.Column('vehicle_id', sa.Integer, sa.ForeignKey('electric_vehicles.id', ondelete='SET NULL')),
        sa.Column('rank', sa.SmallInteger, nullable=False),
        sa.Column('similarity_score', sa.Float, nullable=False),
        sa.Column('explanation_text', sa.Text),
        sa.Column('user_preferences', JSONB),
        sa.Column('feature_weights', JSONB),
        sa.Column('cluster_label', sa.String(50)),
        sa.Column('was_clicked', sa.Boolean, default=False),
        sa.Column('was_helpful', sa.Boolean),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_rec_session', 'recommendation_logs', ['session_id'])
    op.create_index('ix_rec_created', 'recommendation_logs', ['created_at'])

    # cluster_profiles
    op.create_table(
        'cluster_profiles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('cluster_id', sa.Integer, unique=True, nullable=False),
        sa.Column('cluster_label', sa.String(50), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('avg_price', sa.Float),
        sa.Column('avg_range', sa.Float),
        sa.Column('avg_battery', sa.Float),
        sa.Column('avg_charge_time', sa.Float),
        sa.Column('avg_safety', sa.Float),
        sa.Column('avg_autonomy', sa.Float),
        sa.Column('vehicle_count', sa.Integer),
        sa.Column('centroid_vector', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('recommendation_logs')
    op.drop_table('user_sessions')
    op.drop_table('cluster_profiles')
    op.drop_table('electric_vehicles')
