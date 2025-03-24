"""add location column

Revision ID: 89e961d109d2
Revises: 3a6ba5be08e6
Create Date: 2025-03-15 22:46:36.898031

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89e961d109d2'
down_revision: Union[str, None] = '3a6ba5be08e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('price_points', sa.Column('shipment_cost', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'))
    op.add_column('products', sa.Column('location', sa.String(100)))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('price_points', 'shipment_cost')
    op.drop_column('products', 'location')
