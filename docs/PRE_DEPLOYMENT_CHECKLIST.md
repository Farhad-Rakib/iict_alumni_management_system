# Pre-Deployment Checklist

Use this checklist to ensure everything is properly configured before your first deployment.

## Phase 1: GitHub Configuration

- [ ] Repository created on GitHub
- [ ] Code pushed to `main` and `develop` branches
- [ ] `.github/workflows/ci.yml` file exists and is committed
- [ ] `.github/scripts/deploy.sh` file exists and is committed
- [ ] GitHub Actions are enabled (Settings → Actions)
- [ ] Workflows appear in Actions tab

## Phase 2: Docker Hub Setup

- [ ] Docker Hub account created
- [ ] Logged into Docker Hub locally: `docker login`
- [ ] Created `tms-backend` repository
- [ ] Created `tms-frontend` repository
- [ ] Generated access token (not password)
- [ ] Token saved securely

## Phase 3: GitHub Secrets Setup

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

- [ ] `DOCKER_USERNAME` = Your Docker Hub username
- [ ] `DOCKER_PASSWORD` = Your Docker Hub access token (NOT password)

### Contabo VPS Secrets

Get these values from your Contabo VPS setup:

- [ ] `CONTABO_HOST` = Your VPS IP (e.g., `123.45.67.89`)
- [ ] `CONTABO_USER` = SSH username (e.g., `deploy` or `root`)
- [ ] `CONTABO_SSH_PORT` = SSH port (usually `22`)
- [ ] `CONTABO_SSH_KEY` = Your SSH private key content

**Getting SSH key content:**
```bash
cat ~/.ssh/id_rsa
# Copy entire output including BEGIN/END lines
```

## Phase 4: Contabo VPS Preparation

SSH into your VPS:
```bash
ssh deploy@YOUR_VPS_IP -p 22
```

Then verify:

### Docker Installation
- [ ] `docker --version` works
- [ ] `docker-compose --version` works
- [ ] User is in docker group: `groups $USER | grep docker`

### Project Directory
- [ ] `/opt/tms` directory exists
- [ ] `/opt/tms` is owned by deploy user: `ls -ld /opt/tms`

### Environment Configuration
- [ ] `/opt/tms/.env.production` file exists
- [ ] Contains all required variables:
  - [ ] `DATABASE_URL` (with correct credentials)
  - [ ] `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - [ ] `REDIS_URL`
  - [ ] `SECRET_KEY`
  - [ ] `ENVIRONMENT=production`
  - [ ] Email configuration (if needed)
  - [ ] CORS settings
  - [ ] API URL configuration

### Docker Hub Login
- [ ] Able to login: `docker login`
- [ ] Or config file created: `~/.docker/config.json`

### SSH Configuration
- [ ] Public key added to `~/.ssh/authorized_keys`
- [ ] Can login without password from local machine

## Phase 5: Database Configuration

- [ ] PostgreSQL/MySQL database image specified in docker-compose
- [ ] Database username and password set (in .env.production)
- [ ] Database name matches `DATABASE_URL`
- [ ] Database healthcheck configured
- [ ] Persistent volume configured for database data
- [ ] Backup strategy planned
- [ ] Database initialization script created (if needed)
- [ ] Migration scripts tested locally first
- [ ] Alembic/migration tool configured

## Phase 6: Local Configuration Updates

- [ ] Update `.github/scripts/deploy.sh`:
  - Line with `git remote add origin ...` updated with your repo URL
  
- [ ] Update any hardcoded values in workflow files if needed
  - Check `REGISTRY` configuration
  - Check image names match Docker Hub repos

## Phase 7: Pre-Deployment Testing

### Test 1: Docker Build Locally (Optional)

```bash
# Test backend build
cd tms_be
docker build -t tms-backend:test .

# Test frontend build
cd ../tms_ui
docker build -t tms-frontend:test .
```

- [ ] Both builds succeed without errors

### Test 2: Run Workflow with Empty Commit

```bash
# Create empty commit on develop
git checkout develop
git commit --allow-empty -m "Test CI pipeline"
git push origin develop

# Monitor GitHub Actions
# Should complete with green checkmarks
```

- [ ] Workflow appears in Actions tab
- [ ] Tests run successfully
- [ ] Docker images build successfully
- [ ] Images pushed to Docker Hub

### Test 3: Verify Docker Hub Images

```bash
# Login to Docker Hub
docker login

# Verify images exist
docker pull YOUR_USERNAME/tms-backend:develop-COMMIT_SHA
docker pull YOUR_USERNAME/tms-frontend:develop-COMMIT_SHA
```

- [ ] Both images pull successfully

### Test 4: Test Production Deployment

```bash
# Create empty commit on main
git checkout main
git merge develop  # or cherry-pick changes

# Or create empty commit
git commit --allow-empty -m "Test production deployment"
git push origin main

# Monitor GitHub Actions
# Should complete with deployment
```

- [ ] Workflow runs
- [ ] Tests pass
- [ ] Images build and push
- [ ] SSH connects to VPS
- [ ] Deployment script executes
- [ ] Containers start successfully

### Test 5: Verify Services on VPS

```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP -p 22

# Check running containers
docker ps

# Verify services
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs
```

- [ ] Backend container running
- [ ] Frontend container running
- [ ] No errors in logs
- [ ] Services accessible

## Phase 8: Production Readiness

- [ ] Database migrations run successfully
- [ ] Frontend builds to correct path
- [ ] API endpoints respond correctly
- [ ] Environment variables are properly set
- [ ] Logs are being collected
- [ ] Backup strategy is in place
- [ ] Rollback procedure documented and tested
- [ ] Team informed of deployment schedule
- [ ] Monitoring configured (optional)

## Phase 8: First Production Deployment

- [ ] All previous phases completed
- [ ] Code reviewed and approved
- [ ] No blocking issues in GitHub
- [ ] VPS has been verified working
- [ ] Team is ready

**Deploy:**
```bash
git checkout main
git commit --allow-empty -m "First production deployment"
git push origin main

# Monitor GitHub Actions until completion
```

Then verify:
```bash
# Check VPS
ssh deploy@YOUR_VPS_IP -p 22
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

- [ ] All containers running
- [ ] No errors in logs
- [ ] Services accessible
- [ ] Deployment successful!

## Phase 9: Post-Deployment

- [ ] Monitor for errors for 30 minutes
- [ ] Test all main features
- [ ] Check logs regularly: `docker-compose logs -f`
- [ ] Document any issues
- [ ] Plan regular backups
- [ ] Set up monitoring alerts

## Troubleshooting Guide

If any step fails, see:
- `docs/CI_CD_SETUP_GUIDE.md` - Detailed setup instructions
- `docs/CI_CD_QUICK_REFERENCE.md` - Quick command reference
- `docs/TAR_DEPLOYMENT_GUIDE.md` - TAR deployment troubleshooting
- `docs/DATABASE_SETUP_GUIDE.md` - Database configuration and troubleshooting
- GitHub Actions logs - Check specific error messages
- VPS logs - `docker-compose logs backend/frontend`

## Support Contacts

- GitHub Actions Issues: https://docs.github.com/actions
- Docker Issues: https://docs.docker.com
- Contabo Support: Your Contabo account dashboard
- Repository Issues: Create GitHub issue with logs

---

**Last Updated:** 2026-05-23
**Status:** Ready for Production
**Next Review:** After first successful deployment
