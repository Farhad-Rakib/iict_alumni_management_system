# Database Setup & Migration Guide

## Overview

This guide covers database configuration, setup, and automatic migrations in the TMS CI/CD pipeline.

## Database Architecture

```
Local Development
    ↓
PostgreSQL (Docker)
    ↓
Migrations (Alembic)
    ↓
Code with Models
    ↓
CI Tests & Build
    ↓
Push to GitHub
    ↓
Deployment
    ↓
Production Database
```

## Database Configuration

### 1. Local Development Database

For development, use Docker Compose:

```bash
docker-compose -f docker-compose.yml up -d postgres

# Connect with psql
psql -h localhost -U postgres -d tms_dev
```

### 2. Production Database (Contabo VPS)

Create `.env.production` in `/opt/tms/`:

```bash
# Database Connection
DATABASE_URL=postgresql://tms_user:strong_password@db:5432/tms_prod
DB_HOST=db
DB_PORT=5432
DB_NAME=tms_prod
DB_USER=tms_user
DB_PASSWORD=strong_password

# Redis (for caching/sessions)
REDIS_URL=redis://redis:6379/0

# Other config
ENVIRONMENT=production
```

### 3. Database Container Configuration

Your `docker-compose.prod.yml` should include:

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tms_prod
      POSTGRES_USER: tms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tms_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
```

## Database Migrations

### Using Alembic (Python/Flask)

Alembic handles schema changes automatically.

**Create a migration:**

```bash
cd tms_be
alembic revision --autogenerate -m "Add new column"
```

**Apply migrations locally:**

```bash
cd tms_be
alembic upgrade head
```

**Check migration status:**

```bash
cd tms_be
alembic current
alembic history
```

### Automatic Migrations in Deployment

The deployment script automatically runs:

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml \
  exec -T backend alembic upgrade head
```

This happens **after containers start** but **before** verification.

**Process:**
1. Containers start with new images
2. Wait 10 seconds for database to be ready
3. Run migrations (creates/updates tables)
4. Verify services running
5. Done!

### Migration Order

```
1. Docker images loaded
2. Containers start
3. Database service becomes healthy (healthcheck)
4. Backend service starts
5. ✅ Migrations run automatically
6. ✅ Other containers ready
```

## Database Backup Strategy

### Automated Backups

Add to your cron (on VPS):

```bash
# Daily backup at 2 AM
0 2 * * * /opt/tms/backup-db.sh
```

Create `/opt/tms/backup-db.sh`:

```bash
#!/bin/bash
cd /opt/tms
BACKUP_DIR="/opt/tms/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U tms_user tms_prod \
  > $BACKUP_DIR/tms_db_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/tms_db_$TIMESTAMP.sql

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/tms_db_$TIMESTAMP.sql.gz"
```

### Manual Backup

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U tms_user tms_prod > backup_$(date +%Y%m%d).sql

# Download to local machine
exit
scp -P 22 deploy@YOUR_VPS_IP:/opt/tms/backup_*.sql ./backups/
```

## Database Troubleshooting

### Issue: "Database connection refused"

**Solution:**
```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Check database status
docker-compose -f docker-compose.prod.yml ps db

# View logs
docker-compose -f docker-compose.prod.yml logs db

# Test connection
docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user -d tms_prod -c "SELECT 1"
```

### Issue: "Migrations failed"

**Solution:**
```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Check migration status
docker-compose -f docker-compose.prod.yml exec -T backend \
  alembic current

# View migration history
docker-compose -f docker-compose.prod.yml exec -T backend \
  alembic history

# Rollback last migration
docker-compose -f docker-compose.prod.yml exec -T backend \
  alembic downgrade -1

# Re-run migrations
docker-compose -f docker-compose.prod.yml exec -T backend \
  alembic upgrade head
```

### Issue: "Database locked"

**Solution:**
```bash
# Check active connections
docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user -d tms_prod \
  -c "SELECT pid, usename, application_name FROM pg_stat_activity;"

# Kill blocking queries
docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user -d tms_prod \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='tms_prod' AND pid != pg_backend_pid();"
```

### Issue: "Out of disk space"

**Solution:**
```bash
# Check disk usage
df -h

# Clean up old backups
rm /opt/tms/backups/tms_db_*.sql.gz

# Clean Docker images
docker image prune -f
```

## Database Restore

### From Backup

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Restore from backup
zcat backups/tms_db_20260523.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user tms_prod

# Or restore from file
cat backups/backup_20260523.sql | \
  docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user tms_prod
```

## Development Database Setup

### Initialize Local Database

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS

# Start database service
docker-compose up -d postgres

# Wait for it to be ready
sleep 5

# Create migrations
cd tms_be
alembic upgrade head

# Seed sample data (optional)
python -c "from app.seed import seed_data; seed_data()"
```

### Reset Local Database

```bash
# Stop and remove database
docker-compose down -v postgres

# Restart
docker-compose up -d postgres

# Re-apply migrations
cd tms_be
alembic upgrade head
```

## Production Database Checklist

Before first production deployment:

- [ ] Database password is strong (20+ chars, mixed case, numbers, symbols)
- [ ] Database credentials stored in `.env.production` (not committed)
- [ ] Backup script created and tested
- [ ] Database timezone set to UTC
- [ ] Database encoding set to UTF-8
- [ ] Persistent volume configured
- [ ] Database healthcheck configured
- [ ] Migrations tested locally first
- [ ] Rollback plan documented
- [ ] Recovery time objective (RTO) defined

## Environment Variables for Database

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/dbname
DB_HOST=db
DB_PORT=5432
DB_NAME=tms_prod
DB_USER=tms_user
DB_PASSWORD=secure_password

# Optional
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=0
DB_POOL_PRE_PING=true
DB_ECHO=false  # Set to true for SQL logging in dev
```

## Useful Commands

### Backup & Restore

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U tms_user tms_prod > backup.sql

# Restore
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user tms_prod

# Backup with compression
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U tms_user -Fc tms_prod > backup.dump

# Restore compressed
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U tms_user -d tms_prod backup.dump
```

### Database Queries

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U tms_user tms_prod

# List tables
\dt

# View table structure
\d table_name

# Execute query
SELECT * FROM users LIMIT 10;

# Exit
\q
```

### Migrations

```bash
# Create new migration
cd tms_be
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View history
alembic history

# View current version
alembic current
```

---

**Last Updated:** 2026-05-23  
**Related Guides:** [TAR_DEPLOYMENT_GUIDE.md](./TAR_DEPLOYMENT_GUIDE.md), [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)
