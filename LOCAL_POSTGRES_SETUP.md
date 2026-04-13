"""
LOCAL POSTGRESQL SETUP GUIDE
=============================

Since PostgreSQL runs on the HOST (not Docker), follow these setup steps.

## System Requirements

- PostgreSQL 14+ installed locally
- Docker & Docker Compose
- macOS, Linux, or Windows with WSL2

═══════════════════════════════════════════════════════════════════════════════

## macOS Setup

### 1. Install PostgreSQL with Homebrew

```bash
# Install PostgreSQL
brew install postgresql@16

# Verify installation
psql --version
```

### 2. Start PostgreSQL Service

```bash
# Start PostgreSQL (will run in background)
brew services start postgresql@16

# Verify it's running
pg_isready -h localhost
# Should output: accepting connections
```

### 3. Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE alumni_db;

CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';

ALTER ROLE alumni_user SET client_encoding TO 'utf8';
ALTER ROLE alumni_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE alumni_user SET default_transaction_deferrable TO on;
ALTER ROLE alumni_user SET default_transaction_read_only TO off;

GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;

# Verify
\\du                    # List users
\\l                     # List databases

# Exit
\\q
```

### 4. Verify Connection

```bash
# Test connection as alumni_user
psql -U alumni_user -d alumni_db -h localhost

# Should connect successfully
# Type \\q to exit
```

### 5. Stop PostgreSQL (if needed)

```bash
# Stop service
brew services stop postgresql@16

# View status
brew services list

# Start again later
brew services start postgresql@16
```

═══════════════════════════════════════════════════════════════════════════════

## Linux Setup (Ubuntu/Debian)

### 1. Install PostgreSQL

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Verify
psql --version
```

### 2. Start/Enable PostgreSQL

```bash
# Start service
sudo systemctl start postgresql

# Enable on boot
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### 3. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql shell:
CREATE DATABASE alumni_db;

CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';

ALTER ROLE alumni_user SET client_encoding TO 'utf8';
ALTER ROLE alumni_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE alumni_user SET default_transaction_deferrable TO on;
ALTER ROLE alumni_user SET default_transaction_read_only TO off;

GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;

\\q
```

### 4. Configure PostgreSQL for Local Connections

Edit `/etc/postgresql/16/main/postgresql.conf`:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and set:
listen_addresses = 'localhost'
```

Restart:
```bash
sudo systemctl restart postgresql
```

═══════════════════════════════════════════════════════════════════════════════

## Windows Setup (with WSL2)

### 1. Install with Windows Subsystem for Linux

```bash
# In WSL2 terminal
wsl

# Then same as Linux setup above
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### 2. Start PostgreSQL

```bash
sudo service postgresql start
```

### 3. Create Database

Same as Linux setup above (in psql shell)

### 4. Connection String

For Docker containers on Windows with WSL2:

```env
DATABASE_URL=postgresql+asyncpg://alumni_user:password@host.docker.internal:5432/alumni_db
```

═══════════════════════════════════════════════════════════════════════════════

## Environment Configuration

### Backend (.env or docker-compose.yml)

```env
# LOCAL PostgreSQL (host machine)
DATABASE_URL=postgresql+asyncpg://alumni_user:secure_password_change_me@host.docker.internal:5432/alumni_db

# Or for local Python runs:
DATABASE_URL=postgresql+asyncpg://alumni_user:secure_password_change_me@localhost:5432/alumni_db
```

**Why two different hosts?**
- `host.docker.internal` - For Docker containers accessing host
- `localhost` - For local Python development (python main.py)

═══════════════════════════════════════════════════════════════════════════════

## Verify PostgreSQL is Running

### From Terminal

```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# All systems - test connection
psql -U alumni_user -d alumni_db -h localhost -c "SELECT 1;"
# Should output: 1
```

### From Docker Container

```bash
# Start services
docker-compose up -d

# Test from backend container
docker-compose exec backend bash
psql -U alumni_user -d alumni_db -h host.docker.internal -c "SELECT 1;"
```

═══════════════════════════════════════════════════════════════════════════════

## Connection String Format

```
postgresql+asyncpg://USERNAME:PASSWORD@HOST:PORT/DATABASE
                                      ↑
                                      |
           For Docker: host.docker.internal
           For local: localhost
```

Example:
```
postgresql+asyncpg://alumni_user:secure_password_change_me@localhost:5432/alumni_db
```

═══════════════════════════════════════════════════════════════════════════════

## Database Management

### Backup Database

```bash
# Backup to file
pg_dump -U alumni_user -d alumni_db > alumni_backup.sql

# Restore from file
psql -U alumni_user -d alumni_db < alumni_backup.sql
```

### View Database Contents

```bash
# Connect to database
psql -U alumni_user -d alumni_db

# In psql:
\\dt                    # List tables
\\d table_name          # Describe table
SELECT COUNT(*) FROM table_name;  # Count rows
```

### Reset Database

```bash
# Drop all tables (for development)
psql -U alumni_user -d alumni_db

# In psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO alumni_user;
```

═══════════════════════════════════════════════════════════════════════════════

## Running Applications

### Docker Backend (uses host.docker.internal)

```bash
docker-compose up -d backend

# Connection: host.docker.internal:5432
```

### Local Python Development (uses localhost)

```bash
cd tms_be
python main.py

# Connection: localhost:5432
```

### Database Migrations

```bash
# From Docker container
docker-compose exec backend bash
alembic upgrade head

# From local Python
cd tms_be
alembic upgrade head
```

═══════════════════════════════════════════════════════════════════════════════

## Troubleshooting

### Connection Refused

```bash
# Is PostgreSQL running?
psql -U postgres -c "SELECT 1;"

# If not, start it:
# macOS: brew services start postgresql@16
# Linux: sudo systemctl start postgresql
```

### "role alumni_user does not exist"

```bash
# Recreate user
sudo -u postgres psql

CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
```

### "database alumni_db does not exist"

```bash
# Recreate database
sudo -u postgres psql

CREATE DATABASE alumni_db;
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
```

### Docker Can't Reach PostgreSQL

```bash
# Verify host.docker.internal works
docker run -it ubuntu bash
apt-get update && apt-get install postgresql-client
psql -U alumni_user -d alumni_db -h host.docker.internal -c "SELECT 1;"
```

### Port Already in Use

```bash
# Stop other PostgreSQL instances
# macOS: brew services stop postgresql@16
# Linux: sudo systemctl stop postgresql

# Or change port in postgres.conf and connection string
```

═══════════════════════════════════════════════════════════════════════════════

## Performance Tips

1. **Indexing**: Migrations automatically create indexes
2. **Connection Pooling**: FastAPI handles via SQLAlchemy
3. **Backups**: Regular pg_dump backups recommended
4. **Monitoring**: For production, use pg_stat_statements

## Port 5432

Default PostgreSQL port. Can be changed via:
- `postgresql.conf` (server side)
- Connection string (client side)

═══════════════════════════════════════════════════════════════════════════════

## Summary

✅ PostgreSQL runs on HOST machine (not Docker)
✅ Docker containers access via `host.docker.internal`
✅ Local Python accesses via `localhost`
✅ Database: alumni_db
✅ User: alumni_user
✅ Password: secure_password_change_me (CHANGE IN PRODUCTION!)

Key Files:
- Connection string: .env (DATABASE_URL)
- docker-compose.yml: No postgres service
- Backend: Uses environment variable DATABASE_URL

═══════════════════════════════════════════════════════════════════════════════

For more info:
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Docker host.docker.internal: https://docs.docker.com/desktop/networking/

Ready to start? Run: ./start.sh
"""
