# TMS CI/CD Pipeline Documentation

## 📚 Quick Navigation

Start here to understand the complete CI/CD setup with **TAR deployment**:

0. **[Quick Start Guide](./QUICK_START.md)** ⚡⚡ **START HERE FIRST!**
   - 5-minute quick start
   - Minimal setup needed
   - Get deploying immediately
   - Best for: Just want to deploy ASAP

1. **[Setup Complete Summary](./SETUP_COMPLETE.md)** 📋
   - Complete overview of what's set up
   - Architecture and components
   - All required files
   - Best for: Understanding the full system

2. **[TAR Deployment Guide](./TAR_DEPLOYMENT_GUIDE.md)** ⭐
   - Overview of TAR approach (no Docker Hub needed)
   - Setup instructions
   - Database migrations
   - Troubleshooting
   - Best for: Understanding the new TAR deployment method

3. **[Database Setup Guide](./DATABASE_SETUP_GUIDE.md)** 🗄️
   - Database configuration and backup strategies
   - Migration management
   - Restore procedures
   - Database troubleshooting
   - Best for: Database-related questions

4. **[CI/CD Quick Reference](./CI_CD_QUICK_REFERENCE.md)** 🔧
   - Quick commands and workflow overview
   - Common issues and solutions
   - Best for: Quick lookups while working

5. **[Pre-Deployment Checklist](./PRE_DEPLOYMENT_CHECKLIST.md)** ✅
   - Complete verification checklist
   - Phase-by-phase validation
   - First deployment guide
   - Best for: Before deploying to production

---

## 🎯 Quick Start (5 minutes)

If you're in a hurry, follow these steps:

### 1. GitHub Setup
```bash
# Ensure you've pushed to GitHub
git remote add origin https://github.com/YOUR_USERNAME/TMS.git
git push -u origin main
git push -u origin develop
```

### 2. Add GitHub Secrets (4 required)

Go to **Settings → Secrets and variables → Actions** and add only:
- `CONTABO_HOST` = Your VPS IP (e.g., `123.45.67.89`)
- `CONTABO_USER` = SSH username (e.g., `deploy`)
- `CONTABO_SSH_PORT` = 22 (or your SSH port)
- `CONTABO_SSH_KEY` = Your SSH private key content

**No Docker Hub account needed!**

### 3. Prepare VPS (5 minutes)

```bash
# SSH into your VPS
ssh deploy@YOUR_VPS_IP

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Create project directory
mkdir -p /opt/tms
cd /opt/tms

# Create .env.production file
nano .env.production
# Add your environment variables

# Verify setup
docker --version
docker-compose --version
```

### 4. Test the Pipeline
```bash
# Create empty commit on develop
git checkout develop
git commit --allow-empty -m "Test CI pipeline"
git push origin develop

# Monitor GitHub Actions
# Should complete with green checkmarks
```

### 5. Read the Full Guide
Once tests pass, read [TAR_DEPLOYMENT_GUIDE.md](./TAR_DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📁 Project Structure

```
.github/
├── workflows/
│   └── ci.yml                    # Main CI/CD workflow
└── scripts/
    ├── deploy.sh                 # VPS deployment script
    └── setup-checker.sh          # Setup verification tool

docs/
├── QUICK_START.md               # 5-minute quick start
├── SETUP_COMPLETE.md            # Complete overview
├── TAR_DEPLOYMENT_GUIDE.md      # TAR deployment approach
├── DATABASE_SETUP_GUIDE.md      # Database configuration & backup
├── CI_CD_QUICK_REFERENCE.md     # Quick command reference
├── PRE_DEPLOYMENT_CHECKLIST.md  # Deployment checklist
└── CI_CD_INDEX.md               # This file

Root Files:
├── docker-compose.prod.yml      # Production docker setup (with PostgreSQL!)
├── init-db.sql                  # Database initialization
└── .env.production              # Environment config (create on VPS)
```

---

## 🚀 How It Works

### Workflow Overview

```
CODE PUSH
    ↓
GitHub Actions Triggered
    ↓
Run Tests (Python + JavaScript)
    ↓
Tests Pass?
    ├─→ NO  → 🔴 Workflow Fails (Notify user)
    └─→ YES → Continue
    ↓
Build Docker Images (backend + frontend)
    ↓
Save as TAR Files (GitHub Artifacts)
    ↓
On 'main' branch?
    ├─→ NO (develop)  → ✅ Done (tests + images only)
    └─→ YES (main)    → Continue
    ↓
Deploy to Contabo VPS
    ├─→ Download TAR artifacts
    ├─→ SCP to VPS
    ├─→ SSH into VPS
    ├─→ Load Docker images from TAR
    ├─→ Start containers in order:
    │   ├─→ PostgreSQL database (waits for healthcheck)
    │   ├─→ Redis cache (waits for healthcheck)
    │   ├─→ Backend API (depends on DB + Redis)
    │   └─→ Frontend UI (depends on Backend)
    ├─→ Run database migrations (alembic upgrade)
    └─→ Verify services running
    ↓
✅ Deployment Complete (No Docker Hub!)
```

### Branch Strategy

| Branch | Action | Deploy |
|--------|--------|--------|
| `develop` | Tests + Build images | ❌ No |
| `main` | Tests + Build + Deploy | ✅ Yes |
| `feature/*` | PR to develop | Only on PR |

---

## 🔧 What You Need to Set Up

### 1. GitHub
- ✅ Repository created
- ✅ Code pushed
- ✅ 4 Secrets configured (only Contabo credentials)
- ✅ Workflows enabled

### 2. Contabo VPS
- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ Project directory created (/opt/tms)
- ✅ Environment files configured (.env.production)
- ✅ SSH key authentication set up

### 3. Local Machine
- ✅ Git configured
- ✅ SSH key generated
- ✅ GitHub CLI (optional, for viewing artifacts)

---

## 📖 Setup Instructions by Role

### For GitHub Admin
1. Read: [TAR_DEPLOYMENT_GUIDE.md](./TAR_DEPLOYMENT_GUIDE.md) - Sections 1-2
2. Configure 4 secrets in GitHub Settings
3. Verify workflows appear in Actions tab
4. Share deployment commands with team

### For DevOps/VPS Admin
1. Read: [CI/CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md#contabo-vps-setup) - Contabo VPS Setup section
2. Install Docker and Docker Compose
3. Set up project directory and environment files
4. Configure SSH authentication

### For Developers
1. Read: [CI/CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)
2. Understand the deployment flow
3. Know how to test locally and check pipeline status
4. Reference quick commands when needed

---

## ✅ Pre-Deployment Checklist

Before your first production deployment, complete:

**[Pre-Deployment Checklist](./PRE_DEPLOYMENT_CHECKLIST.md)**
- 9 phases of verification
- Test procedures for each phase
- Production readiness assessment

---

## 🆘 Troubleshooting

### Quick Fixes

**Pipeline not running?**
- Verify `.github/workflows/ci.yml` is committed and pushed
- Check GitHub Actions are enabled in Settings

**Docker images not pushing?**
- Verify `DOCKER_PASSWORD` is an access token (not password)
- Check Docker Hub repositories exist
- Verify username matches repository name

**VPS deployment failing?**
- Check SSH credentials in secrets
- Verify Docker/Docker Compose installed on VPS
- Check deployment script has correct repo URL
- Review VPS logs: `docker-compose logs`

**Services not starting?**
- Check `.env.production` exists and is correct
- Verify all required environment variables set
- Check database is running
- View logs: `docker-compose logs backend`

### Full Troubleshooting Guide

See: [CI/CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md#monitoring--troubleshooting)

---

## 📊 Monitoring Your Deployments

### In GitHub
```bash
# View pipeline status
https://github.com/YOUR_USERNAME/TMS/actions

# Or use GitHub CLI
gh run list
gh run view RUN_ID
```

### On Your VPS
```bash
# SSH into server
ssh deploy@YOUR_VPS_IP -p 22

# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔒 Security Best Practices

1. **Never** commit secrets to git
2. **Always** use GitHub Secrets for sensitive data
3. **Rotate** Docker Hub access tokens regularly
4. **Use** dedicated deployment users (not root)
5. **Secure** SSH keys properly (600 permissions)
6. **Monitor** deployments regularly
7. **Backup** your database before deployments

---

## 🔄 Deployment Workflow

### Standard Workflow

```
1. Feature Development
   └─→ Create feature branch
       └─→ Push to GitHub
           └─→ CI runs (tests only)

2. Code Review
   └─→ Create Pull Request to main
       └─→ CI runs (tests on PR)

3. Merge to Production
   └─→ Approve and merge PR
       └─→ Push to main
           └─→ CI runs full pipeline
               └─→ Tests pass?
                   └─→ YES → Deploy to production
```

### Quick Deployment

```bash
git checkout main
git merge develop
git push origin main
# Monitor GitHub Actions
```

---

## 🛠️ Common Commands

### Local Testing
```bash
# Test backend
cd tms_be && python -m pytest

# Test frontend
cd tms_ui && npm run lint && npm run build
```

### Deployment
```bash
# Test deployment (develop)
git push origin develop

# Production deployment
git push origin main
```

### VPS Management
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Rollback
```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms
git log --oneline
git checkout COMMIT_SHA
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📋 File Reference

### Workflow Files

**`.github/workflows/ci.yml`**
- Main CI/CD workflow
- Runs tests on push/PR
- Builds Docker images
- Deploys to VPS on main branch

**`.github/scripts/deploy.sh`**
- Deployment script that runs on VPS
- Pulls code and Docker images
- Stops old containers
- Starts new containers
- Verifies deployment

**`.github/scripts/setup-checker.sh`**
- Verification script
- Checks prerequisites
- Validates configuration
- Usage: `bash .github/scripts/setup-checker.sh`

### Documentation Files

**`docs/CI_CD_SETUP_GUIDE.md`** (Main guide)
- Complete setup instructions
- Step-by-step for GitHub, Docker, VPS
- Environment configuration
- Troubleshooting tips

**`docs/CI_CD_QUICK_REFERENCE.md`** (Quick lookup)
- Common commands
- Quick fixes
- File locations
- When to deploy

**`docs/PRE_DEPLOYMENT_CHECKLIST.md`** (Verification)
- 9-phase checklist
- Test procedures
- Production readiness
- First deployment guide

**`docs/CI_CD_INDEX.md`** (This file)
- Navigation guide
- Quick start
- File reference
- Common commands

---

## 🎓 Learning Resources

### Official Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Docs](https://docs.docker.com)
- [Docker Compose Docs](https://docs.docker.com/compose)

### Local Project Docs
- [DEV_GUIDE.md](../DEV_GUIDE.md) - Project development guide
- [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) - Docker setup
- [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) - Deployment verification

---

## 📞 Getting Help

### If You're Stuck On...

**GitHub/Git Issues:**
→ See [CI/CD_SETUP_GUIDE.md - GitHub Setup](./CI_CD_SETUP_GUIDE.md#github-setup)

**Docker Issues:**
→ See [CI/CD_SETUP_GUIDE.md - Docker Hub Setup](./CI_CD_SETUP_GUIDE.md#docker-hub-setup)

**VPS/SSH Issues:**
→ See [CI/CD_SETUP_GUIDE.md - Contabo VPS Setup](./CI_CD_SETUP_GUIDE.md#contabo-vps-setup)

**Deployment Failures:**
→ See [CI/CD_SETUP_GUIDE.md - Troubleshooting](./CI_CD_SETUP_GUIDE.md#monitoring--troubleshooting)

**Quick Commands:**
→ See [CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)

---

## 📊 Success Metrics

After successful setup, you should be able to:

- ✅ Push code to GitHub and see CI/CD pipeline run automatically
- ✅ View test results and logs in GitHub Actions
- ✅ Deploy to production with a single `git push origin main`
- ✅ Monitor running containers on your VPS
- ✅ View deployment logs and rollback if needed
- ✅ Complete workflow in under 5 minutes

---

## 🎉 You're Ready!

Once you've completed the [Pre-Deployment Checklist](./PRE_DEPLOYMENT_CHECKLIST.md), you're ready to deploy to production!

**Next Steps:**
1. ✅ Complete all phases in the checklist
2. ✅ Test with empty commits on develop and main
3. ✅ Verify services running on VPS
4. ✅ Monitor logs for 30 minutes after first deployment
5. ✅ Document any custom configurations for your team

---

**Last Updated:** 2026-05-23  
**Status:** Production Ready  
**Questions?** Check the full guides or create a GitHub issue

