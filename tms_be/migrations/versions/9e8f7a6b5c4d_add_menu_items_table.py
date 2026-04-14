"""add_menu_items_table

Revision ID: 9e8f7a6b5c4d
Revises: 4fcb13e690d7
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9e8f7a6b5c4d"
down_revision: Union[str, None] = "4fcb13e690d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "menu_items" in inspector.get_table_names():
        return

    op.create_table(
        "menu_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("path", sa.String(length=255), nullable=True),
        sa.Column("icon", sa.String(length=80), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("required_permissions", sa.JSON(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("badge", sa.String(length=60), nullable=True),
        sa.Column("badge_variant", sa.String(length=30), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["parent_id"], ["menu_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(op.f("ix_menu_items_id"), "menu_items", ["id"], unique=False)
    op.create_index(op.f("ix_menu_items_key"), "menu_items", ["key"], unique=False)
    op.create_index(op.f("ix_menu_items_parent_id"), "menu_items", ["parent_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "menu_items" not in inspector.get_table_names():
        return

    op.drop_index(op.f("ix_menu_items_parent_id"), table_name="menu_items")
    op.drop_index(op.f("ix_menu_items_key"), table_name="menu_items")
    op.drop_index(op.f("ix_menu_items_id"), table_name="menu_items")
    op.drop_table("menu_items")
