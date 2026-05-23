# 5-Minute Quick Start Guide

## ⚡ Get Your CI/CD Pipeline Running in 5 Minutes

### Step 1: Push Code to GitHub (1 min)

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS

# Verify remote is set
git remote -v

# Should show: origin https://github.com/YOUR_USERNAME/TMS.git

# If not, add it:
git remote add origin https://github.com/YOUR_USERNAME/TMS.git

# Push code
git push -u origin main
git push -u origin develop
```

### Step 2: Add 4 GitHub Secrets (2 min)

Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

1. **CONTABO_HOST**
   - Value: Your VPS IP (e.g., `123.45.67.89`)

2. **CONTABO_USER**
   - Value: SSH username (e.g., `deploy`)

3. **CONTABO_SSH_PORT**
   - Value: `22` (or your SSH port)

4. **CONTABO_SSH_KEY**
   - Value: 
   ```bash
   cat ~/.ssh/id_rsa
   # Copy entire output including BEGIN/END lines
   ```

### Step 3: Prepare VPS (2 min)

SSH into your VPS:

```bash
ssh YOUR_USERNAME@YOUR_VPS_IP -p 22

# Run these commands:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
mkdir -p /opt/tms
exit

# Logout and login for docker group to take effect
ssh YOUR_USERNAME@YOUR_VPS_IP -p 22
docker ps  # Should work without sudo
```

### Step 4: Create Environment File (CRITICAL!)

```bash
ssh YOUR_USERNAME@YOUR_VPS_IP
cd /opt/tms

cat > .env.production <<'EOF'
# DATABASE
DB_NAME=tms_prod
DB_USER=tms_user
DB_PASSWORD=ChangeMe123!@#Strong_Password
DATABASE_URL=postgresql+asyncpg://tms_user:ChangeMe123!@#Strong_Password@db:5432/tms_prod

# REDIS
REDIS_PASSWORD=ChangeMe456!@#Strong_Password

# APP
SECRET_KEY=ChangeMe-Make-This-Very-Long-Random-String-At-Least-50-Characters
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# EMAIL
SMTP_SERVER=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF

chmod 600 .env.production
```

**⚠️ IMPORTANT:** Change all passwords!

---

## ✅ Done! Your Pipeline is Ready

### Test It:

```bash
# Test branch (no deployment)
git checkout develop
git commit --allow-empty -m "Test CI pipeline"
git push origin develop

# Check: GitHub → Actions (should run tests + build images)
```

### Deploy to Production:

```bash
git checkout main
git commit --allow-empty -m "Deploy to production"
git push origin main

# Check: GitHub → Actions (will deploy to VPS)
# Check: VPS for running containers
```

---

## 📊 What Happens Automatically

```
git push origin main
    ↓
GitHub builds images
    ↓
SCP to VPS
    ↓
VPS starts PostgreSQL
    ↓
VPS starts Redis
    ↓
VPS starts Backend
    ↓
VPS starts Frontend
    ↓
VPS runs migrations
    ↓
✅ All Running!
```

---

## 🔍 Verify Deployment

```bash
# SSH to VPS
ssh YOUR_USERNAME@YOUR_VPS_IP

# Check containers
docker ps

# Expected output:
# - tms_db_prod (PostgreSQL)
# - tms_redis_prod (Redis)
# - alumni_backend_prod (Backend API)
# - alumni_frontend_prod (Frontend)

# View logs
docker-compose -f /opt/tms/docker-compose.prod.yml logs backend

# Test API
curl http://localhost:8000/api/health
```

---

## ❌ Troubleshooting

### "SSH connection refused"
```bash
# Test SSH works
ssh YOUR_USERNAME@YOUR_VPS_IP "whoami"

# If fails, check:
# 1. VPS IP is correct
# 2. SSH port is correct
# 3. Public key on VPS: cat ~/.ssh/authorized_keys
```

### "PostgreSQL won't start"
```bash
ssh YOUR_USERNAME@YOUR_VPS_IP
docker-compose -f /opt/tms/docker-compose.prod.yml logs db
# Check .env.production variables match
```

### "Backend can't connect to database"
```bash
# Check environment variables
cat /opt/tms/.env.production | grep DATABASE_URL
# Must match: postgresql+asyncpg://tms_user:PASSWORD@db:5432/tms_prod
```

---

## 📚 Full Documentation

For detailed information:
- `docs/SETUP_COMPLETE.md` - Full overview
- `docs/CI_CD_INDEX.md` - Navigation hub
- `docs/TAR_DEPLOYMENT_GUIDE.md` - Detailed setup
- `docs/DATABASE_SETUP_GUIDE.md` - Database operations
- `docs/PRE_DEPLOYMENT_CHECKLIST.md` - Complete checklist

---

## 🎯 Common Commands

```bash
# View pipeline status
# Go to: GitHub → Actions

# SSH to VPS
ssh YOUR_USERNAME@YOUR_VPS_IP

# Check services
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check database
docker-compose -f docker-compose.prod.yml exec -T db psql -U tms_user -d tms_prod

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U tms_user tms_prod > backup.sql
```

---

**Status:** ✅ Ready to Deploy  
**Database:** PostgreSQL (containerized)  
**Deployment:** TAR (direct to VPS)  
**Time to Deploy:** ~5 minutes
