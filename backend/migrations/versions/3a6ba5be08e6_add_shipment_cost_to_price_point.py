"""add_shipment_cost_to_price_point

Revision ID: 3a6ba5be08e6
Revises: 
Create Date: 2025-03-15 19:40:17.677204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a6ba5be08e6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('price_points', sa.Column('shipment_cost', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('price_points', 'shipment_cost')