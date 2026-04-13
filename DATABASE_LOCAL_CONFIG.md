"""
DATABASE CONFIGURATION - LOCAL POSTGRESQL
==========================================

Updated all Docker configurations to use LOCAL PostgreSQL instead of containerized.

## Summary of Changes

### ✅ What Changed

1. **docker-compose.yml**
   - ❌ Removed PostgreSQL service entirely
   - ✅ Updated DATABASE_URL to use host.docker.internal:5432
   - ✅ Removed depends_on postgres
   - ✅ Removed postgres_data volume
   - ✅ Added setup instructions in comments

2. **docker-compose.override.yml**
   - ✅ Updated for local PostgreSQL
   - ✅ Set DATABASE_URL to host.docker.internal

3. **docker-compose.prod.yml**
   - ❌ Removed postgres service
   - ✅ Updated DATABASE_URL to host.docker.internal
   - ✅ Removed postgres_data_prod volume
   - ✅ Updated dependencies (now only redis)

4. **tms_be/.env.example**
   - ✅ Added comments about local PostgreSQL
   - ✅ Changed to localhost for local connection
   - ✅ Added setup instructions

### Connection String Format

```
For Docker containers:
postgresql+asyncpg://alumni_user:password@host.docker.internal:5432/alumni_db
                                          ^^^^^^^^^^^^^^^^^^^^^^^^
                                          Docker's bridge to host

For local Python execution:
postgresql+asyncpg://alumni_user:password@localhost:5432/alumni_db
                                          ^^^^^^^^^
                                          Direct local connection
```

═══════════════════════════════════════════════════════════════════════════════

## Quick Start

### Prerequisites

1. **Install PostgreSQL locally**

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo systemctl start postgresql
```

2. **Create database and user**

```bash
# Open PostgreSQL
psql -U postgres

# Run these commands:
CREATE DATABASE alumni_db;
CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
```

3. **Verify connection**

```bash
psql -U alumni_user -d alumni_db -h localhost
# Should connect - type \q to exit
```

### Start Application

```bash
# Original setup script (still works)
./setup.sh

# Start Docker services
./start.sh

# Application will start with:
# - Backend connected to local PostgreSQL
# - Redis in Docker
# - Frontend in Docker
```

═══════════════════════════════════════════════════════════════════════════════

## Architecture

```
┌─────────────────────────┐
│  LOCAL HOST             │
├─────────────────────────┤
│ PostgreSQL              │
│ localhost:5432 ✅       │
└─────────────────────────┘
         ↑
         │ host.docker.internal
         │ (from Docker containers)
         │
┌─────────────────────────────────────────────────────────────────┐
│ DOCKER CONTAINERS                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Backend (FastAPI)    │  │ Frontend (React)     │            │
│  │ Port: 8000           │  │ Port: 5173           │            │
│  │ Uses: DATABASE_URL   │  │ No DB connection     │            │
│  └──────────────────────┘  └──────────────────────┘            │
│           │                                                     │
│           └──────────────────┬──────────────────────┐           │
│                              │                      │           │
│  ┌──────────────────┐  ┌────────────┐        ┌─────────────┐  │
│  │ Redis Cache      │  │ (More)     │        │ (Services)  │  │
│  │ Port: 6379       │  │            │        │             │  │
│  └──────────────────┘  └────────────┘        └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- PostgreSQL runs on HOST machine
- Docker containers access it via special DNS: `host.docker.internal`
- This works on macOS and Windows (needs special config on Linux)
- Allows easy local development and testing

═══════════════════════════════════════════════════════════════════════════════

## Benefits of Local PostgreSQL

✅ **Development Speed**
   - Fast, close to source
   - Direct debugging
   - No container overhead for DB

✅ **Data Persistence**
   - Data survives container restarts
   - Easier backup/restore
   - Can use native PostgreSQL tools

✅ **Performance**
   - Native OS kernel
   - No Docker/VM overhead
   - Better for local testing

✅ **Compatibility**
   - Can use system PostgreSQL
   - Easier team setup
   - Works across platforms

❌ **Not Ideal For**
   - 100% reproducible environments
   - CI/CD pipelines (would need separate setup)
   - Complete Docker isolation

═══════════════════════════════════════════════════════════════════════════════

## Important: host.docker.internal

This is Docker Desktop's special DNS name that resolves to the host machine:

- **macOS**: ✅ Works out of box
- **Windows**: ✅ Works out of box (WSL2)
- **Linux**: ⚠️ Need to add to /etc/hosts:
  ```
  127.0.0.1 host.docker.internal
  ```

Or use `--add-host` in Docker:
```bash
docker run --add-host host.docker.internal:host-gateway ...
```

═══════════════════════════════════════════════════════════════════════════════

## Troubleshooting

### Docker Container Can't Connect to PostgreSQL

**Error:** Connection refused on host.docker.internal:5432

**Solution:**
```bash
# 1. Verify PostgreSQL is running
psql -U alumni_user -d alumni_db -h localhost

# 2. Verify from Docker
docker run --rm alpine sh -c "ping -c 1 host.docker.internal"

# 3. Check Docker networking
docker-compose exec backend ping host.docker.internal
```

### LOCAL_POSTGRES_SETUP.md for detailed help

See [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) for:
- Full installation instructions per OS
- Database creation
- Connection testing
- Backup/restore procedures

═══════════════════════════════════════════════════════════════════════════════

## Files Modified/Created

✏️ **Modified:**
- docker-compose.yml (removed postgres service)
- docker-compose.override.yml (updated connection string)
- docker-compose.prod.yml (removed postgres service)
- tms_be/.env.example (updated comments)

✨ **Created:**
- LOCAL_POSTGRES_SETUP.md (detailed setup guide)
- This file (DATABASE_LOCAL_CONFIG.md)

═══════════════════════════════════════════════════════════════════════════════

## Connection Strings Summary

| Context | Connection String |
|---------|-------------------|
| Docker Backend | `postgresql+asyncpg://alumni_user:password@host.docker.internal:5432/alumni_db` |
| Local Python | `postgresql+asyncpg://alumni_user:password@localhost:5432/alumni_db` |
| psql CLI | `psql -U alumni_user -d alumni_db -h localhost` |
| Production | Same but with env vars: `${DB_USER}:${DB_PASSWORD}` |

═══════════════════════════════════════════════════════════════════════════════

## Next Steps

1. Install PostgreSQL locally (see LOCAL_POSTGRES_SETUP.md)
2. Create alumni_db and alumni_user
3. Run `./start.sh`
4. Access at http://localhost:5173

═══════════════════════════════════════════════════════════════════════════════

Status: ✅ All Docker files updated for local PostgreSQL
Ready for: Immediate use with local database

Last Updated: April 12, 2026
"""
