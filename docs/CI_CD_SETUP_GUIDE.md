# TMS CI/CD Pipeline Setup Guide

## Overview

This guide walks you through setting up a complete CI/CD pipeline that:
- Automatically tests your code on every push/PR to GitHub
- Builds Docker images for both backend (Python/Flask) and frontend (React)
- Pushes images to Docker Hub
- Deploys to your Contabo VPS automatically when merging to `main` branch

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Contabo VPS Setup](#contabo-vps-setup)
4. [Docker Hub Setup](#docker-hub-setup)
5. [GitHub Secrets Configuration](#github-secrets-configuration)
6. [Deployment Flow](#deployment-flow)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [ ] GitHub account with admin access to your repository
- [ ] Docker Hub account
- [ ] Contabo VPS with SSH access
- [ ] Basic knowledge of:
  - Git and GitHub
  - Docker and Docker Compose
  - SSH and Linux command line

---

## GitHub Setup

### Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
cd /Users/farhadrakib/Personal\ Projects/TMS
git remote add origin https://github.com/YOUR_USERNAME/TMS.git

# Create main branch if needed
git checkout -b main

# Push code
git push -u origin main
git push -u origin develop
```

### Step 2: Verify Workflows Are Detected

1. Go to your GitHub repository
2. Click on **Actions** tab
3. You should see your workflow files listed:
   - `CI/CD Pipeline` (from `ci.yml`)

If workflows don't appear, ensure the `.github/workflows/ci.yml` file is:
- In the correct directory structure
- Properly committed and pushed to GitHub

---

## Docker Hub Setup

### Step 1: Create Docker Hub Account

If you don't have one, create a free account at [hub.docker.com](https://hub.docker.com)

### Step 2: Create Access Token

1. Log in to Docker Hub
2. Go to **Account Settings** → **Security**
3. Click **New Access Token**
4. Name it: `tms-github-actions`
5. Select permissions: **Read & Write**
6. Click **Generate**
7. **Copy and save the token** (you won't see it again)

### Step 3: Create Repository

Create two repositories in Docker Hub:
- Repository name: `tms-backend` (set to Private)
- Repository name: `tms-frontend` (set to Private)

---

## GitHub Secrets Configuration

GitHub Secrets allow you to store sensitive information securely. Here's how to set them up:

### Step 1: Access Secrets Settings

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Docker Hub Credentials

Add these secrets:

| Secret Name | Value |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub access token (from Step 2 above) |

**Example:** If your Docker Hub username is `john_doe` and token is `dckr_pat_xxx`, add:
- DOCKER_USERNAME: `john_doe`
- DOCKER_PASSWORD: `dckr_pat_xxx`

### Step 3: Add Contabo VPS Credentials

Add these secrets:

| Secret Name | Value | Example |
|---|---|---|
| `CONTABO_HOST` | Your VPS IP address | `123.456.789.012` |
| `CONTABO_USER` | SSH username | `root` or `deploy` |
| `CONTABO_SSH_PORT` | SSH port (usually 22) | `22` |
| `CONTABO_SSH_KEY` | Your SSH private key | (see below) |

**Getting your SSH private key:**

```bash
# On your local machine, view your SSH private key
cat ~/.ssh/id_rsa
# Or if you use a different key:
cat ~/.ssh/your_key_name

# Copy the entire output (including -----BEGIN RSA PRIVATE KEY----- lines)
```

Then paste the entire key content into the `CONTABO_SSH_KEY` secret in GitHub.

---

## Contabo VPS Setup

### Step 1: Prepare Your VPS

SSH into your Contabo VPS and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y curl
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### Step 2: Create Deployment User (Optional but Recommended)

Instead of using root, create a dedicated deployment user:

```bash
# Create user
sudo useradd -m -s /bin/bash deploy

# Add to docker group (so they can run docker commands)
sudo usermod -aG docker deploy

# Set a password or configure SSH key auth
sudo passwd deploy
```

### Step 3: Set Up Project Directory

```bash
# Create project directory
sudo mkdir -p /opt/tms
sudo chown deploy:deploy /opt/tms

# Switch to deploy user
sudo su - deploy
```

### Step 4: Configure SSH Key Authentication (Recommended)

On your **local machine**:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -f ~/.ssh/contabo_deploy -C "tms-deploy@contabo"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/contabo_deploy.pub deploy@YOUR_VPS_IP -p 22
```

On your **Contabo VPS**:

```bash
# Verify key was added
cat ~/.ssh/authorized_keys
```

### Step 5: Create Environment Files

On your **Contabo VPS**, create the environment configuration:

```bash
# Navigate to project directory
cd /opt/tms

# Create .env.production file
cat > .env.production <<EOF
# Backend Configuration
DATABASE_URL=postgresql://user:password@db:5432/tms_prod
REDIS_URL=redis://redis:6379
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=TMS

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS Settings
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
EOF

# Secure the file
chmod 600 .env.production
```

### Step 6: Configure Docker Hub Login

```bash
# Create a Docker config file with credentials
cat > ~/.docker/config.json <<EOF
{
  "auths": {
    "docker.io": {
      "auth": "$(echo -n USERNAME:PASSWORD | base64)"
    }
  }
}
EOF

# Where USERNAME and PASSWORD are your Docker Hub credentials
# Or use docker login:
docker login
```

---

## Workflow Configuration

### Update Deploy Script

Edit `.github/scripts/deploy.sh` and update this line with your GitHub repository URL:

```bash
git remote add origin https://github.com/YOUR_USERNAME/TMS.git || true
```

Change to:
```bash
git remote add origin https://github.com/YOUR_ACTUAL_USERNAME/YOUR_REPO.git || true
```

### Update Workflow File

If you're using a private Docker registry (not Docker Hub), update `.github/workflows/ci.yml`:

Update the registry configuration:
```yaml
env:
  REGISTRY: docker.io  # or your private registry URL
  BACKEND_IMAGE: ${{ secrets.DOCKER_USERNAME }}/tms-backend
  FRONTEND_IMAGE: ${{ secrets.DOCKER_USERNAME }}/tms-frontend
```

---

## Deployment Flow

### Automatic Deployments

The pipeline automatically runs:

1. **On Push to `develop` branch:**
   - ✅ Runs backend tests
   - ✅ Runs frontend tests
   - ✅ Builds and pushes Docker images
   - ❌ Does NOT deploy to production

2. **On Push to `main` branch:**
   - ✅ Runs all tests
   - ✅ Builds and pushes Docker images
   - ✅ **DEPLOYS to Contabo VPS**

3. **On Pull Requests:**
   - ✅ Runs all tests
   - ❌ Does NOT build/push images
   - ❌ Does NOT deploy

### Manual Test

To test the pipeline without deployment:

```bash
# Push to develop branch (runs tests + builds images)
git checkout develop
git commit --allow-empty -m "Test CI pipeline"
git push origin develop

# Watch GitHub Actions for progress
```

---

## Deployment Process Details

When you push to `main`, here's what happens:

```
1. GitHub detects push to main
   ↓
2. Runs backend tests (Python linting, pytest)
   ↓
3. Runs frontend tests (ESLint, build)
   ↓
4. Both tests pass? → Continue, else → Stop
   ↓
5. Build backend Docker image → Push to Docker Hub
   ↓
6. Build frontend Docker image → Push to Docker Hub
   ↓
7. SSH into Contabo VPS
   ↓
8. Pull latest code
   ↓
9. Pull latest Docker images
   ↓
10. Stop old containers
    ↓
11. Start new containers
    ↓
12. Verify services are running
    ↓
13. ✅ Deployment Complete!
```

---

## Monitoring & Troubleshooting

### View Workflow Status

1. Go to GitHub repository
2. Click **Actions** tab
3. Click on the workflow run to see details

### View Deployment Logs

In GitHub Actions:
1. Click the failing job
2. Expand the step that failed
3. Check the error message

### SSH into VPS and Check Logs

```bash
ssh deploy@YOUR_VPS_IP -p 22

# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Common Issues and Solutions

#### Issue: "Docker credentials invalid"

**Solution:**
```bash
# Verify Docker Hub credentials
docker login -u YOUR_USERNAME

# Update GitHub secret DOCKER_PASSWORD with new token
```

#### Issue: "SSH connection refused"

**Solution:**
```bash
# Verify SSH works
ssh -p 22 deploy@YOUR_VPS_IP "whoami"

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa

# Add VPS to known_hosts
ssh-keyscan -p 22 YOUR_VPS_IP >> ~/.ssh/known_hosts
```

#### Issue: "Deploy script not found"

**Solution:**
Ensure `.github/scripts/deploy.sh` is committed and pushed:
```bash
git add .github/scripts/deploy.sh
git commit -m "Add deployment script"
git push origin main
```

#### Issue: "Containers exit immediately"

**Solution:**
```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

# Check container logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check environment variables
cat /opt/tms/.env.production

# Ensure database is running
docker ps | grep db
```

---

## Database Migrations

If your deployment includes database migrations, add this to `.github/scripts/deploy.sh`:

```bash
# After starting containers, run migrations
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# For Django-based projects:
# docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

---

## Rollback Procedure

If deployment fails, you can quickly rollback:

```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

cd /opt/tms

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Check git log for previous commits
git log --oneline | head -5

# Checkout previous commit
git checkout PREVIOUS_COMMIT_SHA

# Restart with old images
docker-compose -f docker-compose.prod.yml up -d
```

---

## Next Steps

1. ✅ Set up GitHub secrets as described above
2. ✅ Prepare your Contabo VPS
3. ✅ Update configuration files with your details
4. ✅ Make a test push to `develop` branch
5. ✅ Once tests pass, merge to `main` to trigger deployment

---

## Support & Questions

For issues with:
- **GitHub Actions:** Check GitHub documentation at https://docs.github.com/en/actions
- **Docker:** Visit https://docs.docker.com
- **Contabo:** Contact Contabo support or visit their documentation
- **Your Project:** Review your project's README and DEV_GUIDE

---

## Security Best Practices

- 🔒 Never commit `.env` files or secrets to git
- 🔒 Use GitHub Secrets for all sensitive data
- 🔒 Regularly rotate Docker Hub access tokens
- 🔒 Use dedicated deployment users (not root)
- 🔒 Keep SSH keys private and secure
- 🔒 Use HTTPS for all deployments
- 🔒 Regularly update Docker images and dependencies

---

## Useful Commands

### View Workflow Runs Locally

```bash
# Install GitHub CLI
brew install gh

# Login
gh auth login

# View workflow runs
gh run list

# View specific run logs
gh run view RUN_ID
```

### Trigger Workflow Manually (without push)

```bash
gh workflow run ci.yml --ref main
```

### Clean Up Old Docker Images

```bash
# On your Contabo VPS
docker image prune -a -f  # WARNING: Removes all unused images

# Keep last 3 versions
docker image prune -f --filter "until=72h"
```

---

## Last Updated

Date: 2026-05-23
Author: TMS Team

