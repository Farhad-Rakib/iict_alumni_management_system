"""
Database Migration Instructions
================================

This guide explains how to set up and manage database migrations using Alembic.

## Initial Setup

### 1. Initialize Alembic (Already Done)
The Alembic directory structure is already in place:
```
tms_be/app/migrations/
├── alembic.ini
├── versions/
└── env.py
```

### 2. Create Initial Migration

After setting up your database, create the initial migration:
```bash
cd tms_be
alembic revision --autogenerate -m "Initial database schema"
```

This generates a migration file in `migrations/versions/`:
```
001_initial_database_schema.py
```

### 3. Apply Migration

Apply the migration to your database:
```bash
alembic upgrade head
```

This creates all tables defined in the models.

## Working with Migrations

### Create a New Migration

After modifying models:
```bash
alembic revision --autogenerate -m "Description of changes"
```

Example:
```bash
alembic revision --autogenerate -m "Add email_verified column to users"
```

### View Migration Status

```bash
# See current revision
alembic current

# See history
alembic history
```

### Apply Specific Migration

```bash
# Apply next migration
alembic upgrade +1

# Apply to specific revision
alembic upgrade abc123def456
```

### Rollback Migration

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123def456

# Rollback all
alembic downgrade base
```

## Migration File Structure

```python
\"\"\"Initial database schema.

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

\"\"\"
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    \"\"\"Apply migration\"\"\"
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        # ... other columns
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )


def downgrade() -> None:
    \"\"\"Revert migration\"\"\"
    op.drop_table('users')
```

## Best Practices

### 1. Always Autogenerate
Let Alembic detect changes automatically:
```bash
alembic revision --autogenerate -m "message"
```

Don't manually edit migration files unless necessary.

### 2. Clear Commit Messages
```bash
# Good
alembic revision --autogenerate -m "Add phone column to alumni table"

# Bad
alembic revision --autogenerate -m "update"
```

### 3. Test Migrations

Before applying to production:
```bash
# Create separate test database
createdb alumni_db_test

# Test upgrade
alembic -x sqlalchemy.url=postgresql://user:password@localhost/alumni_db_test upgrade head

# Test downgrade
alembic -x sqlalchemy.url=postgresql://user:password@localhost/alumni_db_test downgrade base
```

### 4. Version Control

Always commit migration files:
```bash
git add tms_be/app/migrations/versions/
git commit -m "Add database migration: <description>"
```

### 5. Production Deployments

1. Create migration
2. Test locally
3. Commit to version control
4. Review in pull request
5. Merge to main
6. Deploy and run: `alembic upgrade head`

## Common Tasks

### Adding a Column

```bash
# Modify model in models/user.py
phone = Column(String(20), nullable=True)

# Create migration
alembic revision --autogenerate -m "Add phone to users"

# Apply
alembic upgrade head
```

### Renaming a Column

```bash
# Modify model

# Create migration
alembic revision --autogenerate -m "Rename user.name to full_name"

# This generates a migration with op.alter_column()
```

### Creating an Index

```bash
# In migration file
op.create_index('idx_email', 'users', ['email'], unique=True)

# Apply
alembic upgrade head
```

### Adding a Foreign Key

```bash
# Modify model with ForeignKey relationship

# Create migration
alembic revision --autogenerate -m "Add foreign key user_id to events"

# Apply
alembic upgrade head
```

## Troubleshooting

### Migration Not Detected

If changes aren't detected:
1. Ensure model is imported in `env.py`
2. Check `target_metadata` in `env.py`
3. Verify imports in models

### Conflicts During Merge

If migrations conflict:
1. Don't force merge
2. Create new migration to resolve
3. Test thoroughly

### Can't Downgrade

If downgrade fails:
1. Check SQL syntax in migration
2. Verify constraints allow downgrade
3. May need to fix data first

## Environment Configuration

Set database URL via environment:
```bash
# In .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/alumni_db

# Alembic will read from SQLALCHEMY_DATABASE_URL
# Make sure env.py is configured to use it
```

## Automated Migrations (CI/CD)

In deployment script:
```bash
#!/bin/bash

# Pull latest changes
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start application
gunicorn main:app
```

## Manual Database Creation

If migrations can't create tables:

```python
from app.db.base import init_db
import asyncio

async def setup():
    await init_db()

asyncio.run(setup())
```

## Database Backup Before Migration

```bash
# Backup PostgreSQL database
pg_dump alumni_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
psql alumni_db < backup_20240115_100000.sql
```

## Monitoring Migrations

```bash
# Check current state
alembic current

# View all migrations
alembic history --rev-range 0 1000

# See upgrade/downgrade branches
alembic branches
```

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

For more help, see the migrations directory or consult the team.
"""
