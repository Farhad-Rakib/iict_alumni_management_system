#!/bin/bash

###############################################################################
# PostgreSQL Database Setup Script
# Creates database, user, and applies initial schema
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment
if [ ! -f .env.production ]; then
    log_error ".env.production not found"
    exit 1
fi

set -a
source .env.production
set +a

# Application directory
APP_DIR="/home/iictadeploy/iictaa"

# ============================================
# Database Setup
# ============================================

log_info "Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    log_error "PostgreSQL is not running"
    exit 1
fi

# Create database if not exists
log_info "Creating database '${DB_NAME}'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres createdb "${DB_NAME}" --encoding='UTF8'

log_success "Database '${DB_NAME}' exists"

# Create user if not exists
log_info "Creating database user '${DB_USER}'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '${DB_USER}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"

# Grant privileges
log_info "Granting privileges to '${DB_USER}'..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};"

log_success "Database user and privileges configured"

# ============================================
# Apply Database Migrations
# ============================================

log_info "Running database migrations..."

cd "${APP_DIR}/tms_be"

# Run alembic migrations through Docker
docker run --rm \
    -v "$(pwd):/app" \
    --network host \
    -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" \
    ghcr.io/farhad-rakib/iict_alumni_management_system/alumni-backend:latest \
    alembic upgrade head

log_success "Database migrations completed"

# ============================================
# Backup Configuration
# ============================================

log_info "Setting up automated backups..."

# Create backup directory
BACKUP_DIR="/var/backups/postgresql"
sudo mkdir -p "${BACKUP_DIR}"

# Create backup script
sudo tee /etc/cron.daily/backup-alumni-db > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="alumni_db"
DB_USER="alumni_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
/usr/bin/pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz

# Keep only last 7 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete

# Log backup
echo "Backup completed: ${DB_NAME}_${TIMESTAMP}.sql.gz" >> ${BACKUP_DIR}/backup.log
EOF

sudo chmod +x /etc/cron.daily/backup-alumni-db
log_success "Automated backup configured"

echo ""
echo -e "${GREEN}=== Database Setup Complete ===${NC}"
echo ""
echo "Database Details:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Host: localhost"
echo "  Port: ${DB_PORT}"
echo ""
echo "Backups will be stored in: ${BACKUP_DIR}"
echo ""
