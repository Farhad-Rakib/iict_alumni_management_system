"""
DOCKER SETUP & TROUBLESHOOTING GUIDE
=====================================

This guide explains the Docker configuration and how to use different setups.

## Docker Files Overview

### Configuration Files

1. **docker-compose.yml** - Main production-ready configuration
2. **docker-compose.override.yml** - Development overrides (for hot reload)
3. **docker-compose.prod.yml** - Strict production setup with environment vars
4. **tms_be/Dockerfile** - Backend container image
5. **tms_be/.dockerignore** - Files to exclude from backend build
6. **tms_ui/Dockerfile** - Frontend production container
7. **tms_ui/Dockerfile.dev** - Frontend development container (hot reload)
8. **tms_ui/.dockerignore** - Files to exclude from frontend build

---

## Fixes Applied

### 1. Backend Dockerfile ✅
**Issue**: Used `--reload` flag in production (`CMD`)
**Fix**: 
- Removed `--reload` from default CMD for production use
- Added `EXPOSE 8000` for explicit port declaration
- Development override provides `--reload` via docker-compose.override.yml

**Result**: 
```dockerfile
# OLD (Wrong)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# NEW (Correct)
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 2. Frontend Dockerfile ✅
**Issues**:
- Used `npm run preview` which is not suitable for development
- Wasted stage installing global Vite
- No proper web server for production

**Fixes**:
- Stage 1 (builder): Build React app with npm ci (safer than npm install)
- Stage 2 (production): Use nginx for serving static files
- Configured nginx to handle SPA routing (try_files)

**Result**:
```dockerfile
# OLD (Issues)
FROM node:20-alpine AS builder
...
CMD ["npm", "run", "preview"]  # Not ideal

# NEW (Correct)
FROM node:20-alpine AS builder
...
FROM nginx:alpine              # Proper web server
...
CMD ["nginx", "-g", "daemon off;"]
```

- Created **Dockerfile.dev** for development with Vite dev server
- Allows hot reload during development

---

### 3. docker-compose.yml ✅
**Issues**:
- Missing network declarations on services
- Incomplete database healthcheck
- Missing POSTGRES_INITDB_ARGS for proper encoding
- Improper network configuration

**Fixes**:
- Added `networks: - alumni_network` to all services
- Improved PostgreSQL healthcheck query
- Added UTF-8 encoding configuration
- Changed from default network to explicit bridge network
- Added `restart: unless-stopped` for auto-restart

**Result**:
```yaml
# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U alumni_user -d alumni_db"]
  
# Services now have network connectivity
networks:
  - alumni_network

volumes:
  postgres_data:
    driver: local

networks:
  alumni_network:
    driver: bridge  # Explicit bridge network
```

---

### 4. Created docker-compose.override.yml ✅
**Purpose**: Override settings for development
**Benefits**:
- Enables hot reload without modifying main compose file
- Automatic when running `docker-compose up` locally
- Keeps production config clean

**Content**:
```yaml
services:
  backend:
    environment:
      DEBUG: "True"
    command: uvicorn main:app --reload  # Hot reload in dev

  frontend:
    build:
      dockerfile: Dockerfile.dev        # Use dev version
    volumes:
      - ./tms_ui:/app                   # Source mount
      - /app/node_modules                # Preserve modules
```

---

### 5. Created docker-compose.prod.yml ✅
**Purpose**: Production deployment with required env vars
**Features**:
- Uses gunicorn instead of uvicorn for production
- Requires environment variables (prevents accidental missing config)
- Separate volumes for production data
- Better logging configuration
- More connection pool settings

**Usage**:
```bash
docker-compose -f docker-compose.prod.yml up
```

---

### 6. Added .dockerignore files ✅
**Benefits**:
- Faster builds (excludes unnecessary files)
- Smaller image sizes
- Prevents sensitive files in containers

**For Backend**:
- Excludes: `__pycache__`, `.venv`, `*.pyc`, `.env`, etc.

**For Frontend**:
- Excludes: `node_modules`, `.git`, `.env`, etc.

---

## Usage Instructions

### Development (Local with Hot Reload)

```bash
# Start services with development overrides
docker-compose up -d

# View logs
docker-compose logs -f

# The system will NOT have reload by default
# Use docker-compose.override.yml to enable it
docker-compose up -d
```

**What this gives you**:
- ✅ Auto-reload on code changes
- ✅ Source code mounted for easy editing
- ✅ Fast development cycle

---

### Production Deployment

```bash
# Using main production config
docker-compose -f docker-compose.prod.yml up -d

# Or using strict production config
docker-compose prod up -d
```

**Environment file (.env.prod)**:
```env
DB_USER=prod_user
DB_PASSWORD=VERY_STRONG_PASSWORD_HERE
REDIS_PASSWORD=REDIS_PASSWORD_HERE
SECRET_KEY=GENERATED_SECRET_KEY_HERE
CORS_ORIGINS=["https://alumni.example.com"]
SMTP_SERVER=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
```

**Start with env file**:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## Building Images

### Build Backend
```bash
docker build -t alumni-backend:1.0.0 ./tms_be
```

### Build Frontend
```bash
docker build -t alumni-frontend:1.0.0 ./tms_ui
```

### Build All (via compose)
```bash
docker-compose build --no-cache
```

---

## Common Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs              # All services
docker-compose logs -f backend   # Specific service
docker-compose logs -f --tail 50 # Last 50 lines

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Stop services (keep volumes)
docker-compose down

# Stop and remove volumes (careful!)
docker-compose down -v

# Remove dangling images
docker image prune

# View image sizes
docker images

# Rebuild specific service
docker-compose build backend --no-cache
docker-compose up -d backend
```

---

## Troubleshooting

### Services won't start

```bash
# Check error logs
docker-compose logs

# Verify images built
docker images | grep alumni

# Check disk space
df -h

# Prune unused Docker resources
docker system prune -a
```

### Database connection error

```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U alumni_user -d alumni_db -c "SELECT 1;"
```

### Frontend not hot-reloading

```bash
# Ensure override file exists
ls docker-compose.override.yml

# Check Dockerfile.dev is being used
docker-compose ps frontend
docker-compose exec frontend ls -la

# Or manually use dev file
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

### Port already in use

```bash
# Find process using port
lsof -i :5173
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5174:5173"  # Use 5174 instead
```

### Out of disk space

```bash
# Remove all dangling images/volumes
docker system prune -a --volumes

# Remove specific container
docker-compose rm -f backend

# Rebuild
docker-compose up -d
```

---

## Performance Optimization

### Reduce Build Time

```dockerfile
# Use .dockerignore to exclude files
# Use multi-stage builds (already done)
# Use docker build cache:
docker-compose build --no-cache backend  # Force rebuild
docker-compose build backend             # Use cache
```

### Reduce Image Size

**Backend**:
- Using `slim` Python image: ~150MB
- Using `full` Python image: ~900MB

**Frontend**:
- Using nginx: ~40MB
- Using node with npm serve: ~300MB

---

## Networking

### Service Communication

Services communicate via service names:
- Backend reaches PostgreSQL: `postgres:5432`
- Frontend reaches Backend: `backend:8000`
- Backend reaches Redis: `redis:6379`

### External Access

Services exposed via ports:
```yaml
ports:
  - "5173:5173"  # localhost:5173 -> container:5173
  - "8000:8000"  # localhost:8000 -> container:8000
  - "5432:5432"  # localhost:5432 -> container:5432
```

---

## Security Best Practices

### Don't commit these:
```
.env                    # Contains passwords
.env.prod              # Contains production secrets
docker-compose.prod.yml # May contain sensitive data
```

### Use environment variables:
```bash
export SECRET_KEY="generated-random-key"
export DB_PASSWORD="strong-password"
docker-compose up -d
```

### Change default credentials:
Edit these in .env before running:
```env
POSTGRES_PASSWORD=secure_password_change_me
POSTGRES_USER=alumni_user
SECRET_KEY=your-secret-key-change-in-production
REDIS_PASSWORD=change-this-password
```

---

## Deployment Checklist

- [ ] All services build successfully
- [ ] Services start without errors
- [ ] Health checks pass
- [ ] Database migrations run
- [ ] API responds at http://localhost:8000/docs
- [ ] Frontend loads at http://localhost:5173
- [ ] Authentication works
- [ ] Logs are clean (no errors)

---

## Docker Compose Files Reference

### Main Composition
```
docker-compose.yml
├── postgres (database)
├── redis (cache)
├── backend (api)
└── frontend (ui)
```

### Development
```
docker-compose.override.yml
├── Enables hot reload
├── Mounts source volumes
└── Sets DEBUG=True
```

### Production
```
docker-compose.prod.yml
├── Uses gunicorn
├── Requires env vars
├── Stricter logging
└── Better resource limits
```

---

## Additional Resources

- Docker documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Best Practices: https://docs.docker.com/develop/dev-best-practices/

---

## Summary of Fixes

| Issue | File | Fix | Status |
|-------|------|-----|--------|
| Reload in production CMD | tms_be/Dockerfile | Removed --reload | ✅ |
| No web server | tms_ui/Dockerfile | Added nginx | ✅ |
| Missing networks | docker-compose.yml | Added network config | ✅ |
| No hot reload setup | None | Created .override | ✅ |
| No prod config | None | Created .prod | ✅ |
| Slow builds | None | Added .dockerignore | ✅ |

---

Last Updated: April 12, 2026
Status: All Docker errors fixed and optimized
"""
