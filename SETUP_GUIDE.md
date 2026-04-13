"""
Alumni Management System - Setup Guide
======================================

Complete setup instructions for the Alumni Management System with both backend and frontend.

## Quick Start with Docker Compose

### Prerequisites
- PostgreSQL 14+ installed and running on localhost:5432 ⚠️ **IMPORTANT**
- Docker & Docker Compose installed
- 10GB free disk space
- Ports available: 6379, 8000, 5173

### Step 1: Setup Local PostgreSQL ⚠️ CRITICAL

**This project uses LOCAL PostgreSQL (not Docker)!**

See detailed setup: [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md)

Quick setup:
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb alumni_db
psql -d alumni_db -c "CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';"
psql -d alumni_db -c "GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;"

# Verify
psql -U alumni_user -d alumni_db -h localhost -c "SELECT 1;"
```

### Step 2: Create Environment Files

```bash
# Backend
cp tms_be/.env.example tms_be/.env

# Frontend
cp tms_ui/.env.example tms_ui/.env.local
```

### Step 3: Start Services

```bash
cd ~/Personal\ Projects/TMS
docker-compose up -d
```

### Step 4: Verify Services

```bash
docker-compose ps
```

Services will be available at:
- Backend API: http://localhost:8000
- Frontend UI: http://localhost:5173
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432 (on host machine)

### Stopping Services
```bash
docker-compose down -v  # Include -v to remove volumes
```

---

## Manual Setup (Without Docker)

### Backend Setup

#### 1. Prerequisites
```bash
python --version  # 3.11+
postgres --version  # 14+
```

#### 2. Create Virtual Environment
```bash
cd tms_be
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Database Setup
```bash
# Create PostgreSQL database
createdb -U postgres alumni_db

# Or using psql
psql -U postgres
CREATE DATABASE alumni_db;
```

#### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

#### 6. Initialize Database
```bash
python -c "from app.db.base import init_db; import asyncio; asyncio.run(init_db())"
```

#### 7. Run Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

#### 1. Prerequisites
```bash
node --version  # 18+
npm --version   # 9+
```

#### 2. Install Dependencies
```bash
cd tms_ui
npm install
```

#### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local - ensure API URL points to backend
```

#### 4. Run Frontend
```bash
npm run dev
```

Frontend will be available at http://localhost:5173

---

## Database Initialization

### Create Initial Admin User

1. Access backend shell
```bash
# Using Docker
docker exec -it alumni_backend python

# Or in virtual environment
python
```

2. Create admin user
```python
from app.models.user import User, RoleEnum
from app.core.security import hash_password
from app.db.base import AsyncSessionLocal, init_db

async def create_admin():
    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@alumni.com",
            full_name="Admin User",
            role=RoleEnum.SUPER_ADMIN,
            password_hash=hash_password("admin123"),
            is_verified=True,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("Admin user created!")

import asyncio
asyncio.run(create_admin())
```

### Seed Test Data (Optional)

```python
# Similar approach to create test alumni, events, jobs, etc.
# Located in tms_be/scripts/seed.py (to be created)
```

---

## Configuration Guide

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/alumni_db

# Security
SECRET_KEY=your-super-secure-random-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OTP Settings
OTP_EXPIRE_MINUTES=10
OTP_LENGTH=6
VERIFICATION_LINK_EXPIRE_HOURS=72
MAX_OTP_ATTEMPTS=5

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use app-specific password for Gmail
SENDER_EMAIL=noreply@alumni.com

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Application
DEBUG=False
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Alumni Management System
VITE_APP_VERSION=1.0.0
```

---

## API Testing

### Using Swagger UI
Navigate to http://localhost:8000/docs

### Using cURL

```bash
# Send OTP
curl -X POST "http://localhost:8000/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Verify OTP (replace with actual OTP)
curl -X POST "http://localhost:8000/api/v1/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Using Postman
1. Import API collection
2. Set environment variables with tokens
3. Test endpoints

---

## Troubleshooting

### Database Connection Issues

**Error: "could not connect to server"**
- Verify PostgreSQL is running
- Check connection string
- Verify database exists

### Port Already In Use

```bash
# Find process using port 8000 (Linux/Mac)
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in uvicorn command
uvicorn main:app --port 8001
```

### Docker Issues

```bash
# View logs
docker-compose logs -f backend

# Rebuild containers
docker-compose up -d --build

# Remove everything and start fresh
docker-compose down -v
docker-compose up -d
```

### Frontend Not Connecting to Backend

- Check API URL in .env.local
- Ensure backend is running
- Check browser console for CORS errors
- Verify firewall settings

---

## Development Tips

### Backend Development
- Use `--reload` flag with uvicorn for auto-reload
- Use Python debugger for breakpoints
- Run tests with `pytest`
- Format code with `black`

### Frontend Development
- Vite has fast HMR (Hot Module Replacement)
- React DevTools browser extension helpful
- Use TypeScript strict mode
- Check console for warnings

---

## Production Deployment

### Backend
1. Use Gunicorn/uWSGI instead of uvicorn
2. Set DEBUG=False
3. Use strong SECRET_KEY
4. Configure proper logging
5. Set up monitoring
6. Use HTTPS/SSL

### Frontend
1. Build for production: `npm run build`
2. Serve static files with proper caching
3. Configure CDN
4. Set up monitoring
5. Enable gzip compression

### Database
1. Enable SSL connections
2. Set up automated backups
3. Configure connection pooling
4. Monitor performance
5. Set up replication

---

## Support & Further Help

- Backend README: `tms_be/README.md`
- Frontend README: `tms_ui/README.md`
- API Documentation: http://localhost:8000/docs
- Project Repository: https://github.com/yourname/alumni-management

---

## Checklist

- [ ] Database created and configured
- [ ] Environment files created and updated
- [ ] Backend running successfully
- [ ] Frontend able to connect to backend
- [ ] API endpoints responding
- [ ] Admin user created
- [ ] Authentication working
- [ ] All modules accessible
- [ ] Tests passing
- [ ] Documentation reviewed

Good luck with your Alumni Management System! 🎓
