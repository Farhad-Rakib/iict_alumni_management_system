# TAR Deployment Approach Guide

## Overview

This guide explains the TAR (direct deployment) approach where Docker images are built in GitHub Actions, saved as TAR files, and directly deployed to your Contabo VPS without using Docker Hub.

## How It Works

```
GitHub Actions
    ↓
1. Run Tests (Python + JavaScript)
    ↓
2. Build Docker Images
    ↓
3. Save Images as .tar Files
    ↓
4. Upload TAR files as Artifacts
    ↓
Download Artifacts
    ↓
5. SCP TAR files to VPS
    ↓
6. Load images from TAR files (docker load)
    ↓
7. Stop old containers
    ↓
8. Start new containers
    ↓
✅ Deployment Complete
```

## Advantages of TAR Approach

✅ **No Docker Hub Required**
- No monthly costs
- No registry maintenance
- No docker.io account needed

✅ **Faster Deployments**
- No need to push to Docker Hub
- No need to pull from Docker Hub
- TAR transfer is direct SSH

✅ **Simpler Setup**
- Fewer GitHub Secrets required
- No Docker Hub credentials to manage
- Fewer authentication steps

✅ **Better Privacy**
- Images never leave your infrastructure
- Direct GitHub → VPS transfer
- No third-party registry

## Disadvantages of TAR Approach

❌ **Single Deployment Target**
- Can't easily deploy to multiple environments
- Each deployment builds fresh images

❌ **No Image History/Registry**
- Can't pull old images
- No version tracking on registry

❌ **Network Requirements**
- GitHub runner must have outbound SSH
- TAR files transferred over network
- Larger data transfer

## Required GitHub Secrets

Since we're not using Docker Hub, you need **fewer secrets**:

| Secret | Required | Value |
|--------|----------|-------|
| `CONTABO_HOST` | ✅ Yes | Your VPS IP (e.g., `123.45.67.89`) |
| `CONTABO_USER` | ✅ Yes | SSH username (e.g., `deploy`) |
| `CONTABO_SSH_PORT` | ✅ Yes | SSH port (usually `22`) |
| `CONTABO_SSH_KEY` | ✅ Yes | SSH private key content |
| `DOCKER_USERNAME` | ❌ No | Not needed |
| `DOCKER_PASSWORD` | ❌ No | Not needed |

That's it! 4 secrets instead of 6.

## Setup Instructions

### Step 1: GitHub Setup

```bash
# Push code to GitHub
cd /Users/farhadrakib/Personal\ Projects/TMS
git remote add origin https://github.com/YOUR_USERNAME/TMS.git
git push -u origin main
git push -u origin develop
```

### Step 2: Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

```
CONTABO_HOST = 123.45.67.89
CONTABO_USER = deploy
CONTABO_SSH_PORT = 22
CONTABO_SSH_KEY = (your SSH private key content)
```

**Getting your SSH key:**
```bash
cat ~/.ssh/id_rsa
```

Copy the entire output including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`.

### Step 3: Prepare Contabo VPS

SSH into your VPS:

```bash
ssh deploy@YOUR_VPS_IP -p 22
```

Then run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
sudo mkdir -p /opt/tms
sudo chown deploy:deploy /opt/tms

# Add deploy user to docker group
sudo usermod -aG docker deploy

# Verify installations
docker --version
docker-compose --version

# (May need to logout and login for docker group to take effect)
exit
ssh deploy@YOUR_VPS_IP -p 22
docker ps  # Should work without sudo
```

### Step 4: Configure SSH Key Authentication

On your **local machine**:

```bash
# Generate key (if you don't have one)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/contabo_deploy

# Copy to VPS
ssh-copy-id -i ~/.ssh/contabo_deploy.pub deploy@YOUR_VPS_IP -p 22
```

Test connection:
```bash
ssh deploy@YOUR_VPS_IP -p 22 "whoami"
```

### Step 5: Create Environment File

On your **VPS**, create `/opt/tms/.env.production`:

```bash
ssh deploy@YOUR_VPS_IP -p 22
cd /opt/tms

cat > .env.production <<EOF
# ========== DATABASE CONFIGURATION ==========
# PostgreSQL (runs in Docker container)
DB_NAME=tms_prod
DB_USER=tms_user
DB_PASSWORD=YourStrongPasswordHere123!@#
POSTGRES_PASSWORD=YourStrongPasswordHere123!@#

# Connection string (internal Docker network)
DATABASE_URL=postgresql+asyncpg://tms_user:YourStrongPasswordHere123!@#@db:5432/tms_prod

# ========== REDIS CONFIGURATION ==========
REDIS_PASSWORD=YourRedisPasswordHere456!@#

# ========== APPLICATION CONFIGURATION ==========
SECRET_KEY=your-secret-key-here-change-this-in-production-with-something-very-long-and-random
ENVIRONMENT=production

# ========== CORS & API CONFIGURATION ==========
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# ========== EMAIL CONFIGURATION ==========
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-from-gmail

# ========== DEBUG (Set to False in production) ==========
DEBUG=False
EOF

chmod 600 .env.production
cat .env.production  # Verify it was created
```

**Important Security Notes:**
- 🔒 Change all passwords to strong, unique values
- 🔒 The file has `600` permissions (only owner can read)
- 🔒 DB_PASSWORD and POSTGRES_PASSWORD must be identical
- 🔒 Never commit this file to git
- 🔒 Use `postgresql+asyncpg://` for async database driver

## Workflow Stages

### Stage 1: Testing
- Runs on all pushes to any branch
- Tests backend (pytest)
- Tests frontend (ESLint)
- No images built or deployed

### Stage 2: Building (develop & main only)
- Builds Docker images
- Saves as TAR files
- Uploads as GitHub artifacts (1 day retention)

### Stage 3: Deployment (main only)
- Downloads TAR artifacts
- Transfers to VPS via SCP
- Loads images on VPS
- Starts containers

## GitHub Artifacts

The workflow creates temporary artifacts stored for **1 day**:

- `tms-backend-image` - Backend Docker image TAR
- `tms-frontend-image` - Frontend Docker image TAR

**Note:** These are automatically cleaned up, so re-deployment requires a new push.

## Deployment Process

### Automatic Deployment

```bash
git checkout main
git commit --allow-empty -m "Deploy to production"
git push origin main

# Workflow automatically:
# 1. Runs tests
# 2. Builds images
# 3. Transfers to VPS
# 4. Loads images
# 5. Starts containers
```

### View Progress

1. Go to **GitHub Actions** tab
2. Click on the workflow run
3. Monitor each step
4. Check "Deploy to Contabo VPS" step for SCP/SSH output

## Database Migrations

The deployment script automatically runs database migrations after containers start:

```bash
# This is executed automatically during deployment
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

**Process:**
1. Docker images loaded on VPS
2. Containers start
3. Database service becomes ready (healthcheck)
4. ✅ Migrations run automatically
5. Services verified as running

### Manual Migration Management

If you need to manage migrations manually:

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Check migration status
docker-compose -f docker-compose.prod.yml exec -T backend alembic current

# View migration history
docker-compose -f docker-compose.prod.yml exec -T backend alembic history

# Rollback last migration (if needed)
docker-compose -f docker-compose.prod.yml exec -T backend alembic downgrade -1

# Re-run migrations
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Create New Migrations

When you add new models or modify existing ones:

```bash
# Locally
cd tms_be
alembic revision --autogenerate -m "Description of change"

# Commit and push
git add tms_be/migrations/versions/
git commit -m "Add migration: description"
git push origin main

# Deployment will automatically run the new migration
```

For detailed database setup and troubleshooting, see: **[DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md)**

## Troubleshooting

### Issue: "SSH connection refused"

**Solution:**
```bash
# Verify SSH works locally
ssh deploy@YOUR_VPS_IP -p 22 "whoami"

# If it fails, check:
# 1. VPS IP is correct
# 2. SSH port is correct (usually 22)
# 3. Public key is in ~/.ssh/authorized_keys on VPS

# Re-add key:
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@YOUR_VPS_IP -p 22
```

### Issue: "TAR file not found"

**Solution:**
- Wait for GitHub Actions to complete artifact upload
- Check "Upload backend/frontend image" steps succeeded
- Artifacts expire after 1 day - re-run if needed

### Issue: "Failed to load image"

**Solution:**
```bash
ssh deploy@YOUR_VPS_IP
# Check TAR files exist
ls -lah /tmp/tms-*.tar

# Check Docker daemon is running
docker ps

# View deployment logs
docker-compose -f docker-compose.prod.yml logs backend
```

### Issue: "Containers not starting"

**Solution:**
```bash
ssh deploy@YOUR_VPS_IP
cd /opt/tms

# Check environment file
cat .env.production

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Test specific service
docker-compose -f docker-compose.prod.yml logs backend
```

## Troubleshooting

### Quick Fixes

### Local Machine

```bash
# Test pipeline (no deploy)
git checkout develop
git commit --allow-empty -m "Test"
git push origin develop

# Deploy to production
git checkout main
git merge develop
git push origin main

# View artifacts
gh run list
gh run view RUN_ID
gh run download RUN_ID -n tms-backend-image
```

### Contabo VPS

```bash
# SSH to VPS
ssh deploy@YOUR_VPS_IP -p 22

# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down

# Clean old images
docker image prune -f
```

## Security Considerations

1. **SSH Keys:**
   - Store private key securely locally
   - Add to GitHub Secrets (never commit)
   - Rotate regularly

2. **TAR Files:**
   - Transferred via SSH (encrypted)
   - Stored in `/tmp/` on VPS (cleaned up after)
   - Not stored permanently

3. **VPS Access:**
   - Use dedicated deploy user (not root)
   - Restrict SSH to known IPs (optional)
   - Keep Docker/OS updated

## Performance Notes

- TAR image transfer varies by size (usually 100-500MB)
- SCP typically transfers at full network speed
- Docker load is very fast (seconds)
- Deployment usually completes in 2-5 minutes

## Scaling Beyond One VPS

If you want to deploy to multiple environments later, you have options:

1. **Multiple Deployments:**
   - Add more "Deploy to VPS" jobs
   - One for staging, one for production

2. **Switch to Docker Hub:**
   - Build once, push to registry
   - Deploy to multiple VPS servers

3. **Private Registry:**
   - Set up Docker registry on one VPS
   - Other VPS servers pull from there

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Add 4 GitHub Secrets
3. ✅ Prepare VPS (Docker, directories)
4. ✅ Set up SSH authentication
5. ✅ Test with develop branch push
6. ✅ Deploy to production with main branch push

---

**Status:** TAR Approach Enabled  
**Last Updated:** 2026-05-23  
**Questions?** See [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)
