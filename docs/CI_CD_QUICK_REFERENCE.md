# CI/CD Quick Reference

## 🚀 Deployment Commands

### Test Pipeline (No Deploy)
```bash
git checkout develop
git commit --allow-empty -m "Test pipeline"
git push origin develop
```

### Deploy to Production
```bash
git checkout main
git commit --allow-empty -m "Deploy to production"
git push origin main
```

---

## 📊 Pipeline Workflow

```
develop branch (tests only)
    ↓
Backend tests + Frontend tests
    ↓
Pass? → Build & Push Docker Images
    ↓
Done (no deployment)

---

main branch (tests + deploy)
    ↓
Backend tests + Frontend tests
    ↓
Pass? → Build & Push Docker Images
    ↓
Deploy to Contabo VPS
    ↓
Verify Services Running
    ↓
✅ Complete
```

---

## 🔐 GitHub Secrets Required

| Secret | Description | Example |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `john_doe` |
| `DOCKER_PASSWORD` | Docker Hub access token | `dckr_pat_...` |
| `CONTABO_HOST` | VPS IP address | `123.45.67.89` |
| `CONTABO_USER` | SSH username | `deploy` |
| `CONTABO_SSH_PORT` | SSH port | `22` |
| `CONTABO_SSH_KEY` | SSH private key | `-----BEGIN RSA...` |

---

## 🔍 Monitoring

### View Pipeline Status
```bash
# GitHub Actions
https://github.com/YOUR_USERNAME/TMS/actions

# Or with GitHub CLI
gh run list
gh run view RUN_ID
```

### Check VPS Status
```bash
ssh deploy@YOUR_VPS_IP -p 22

# View running containers
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🛠️ Useful Commands

### Local Testing
```bash
# Test backend
cd tms_be
python -m pytest

# Test frontend
cd ../tms_ui
npm run lint
npm run build
```

### VPS Maintenance
```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP -p 22

# Stop all services
docker-compose -f docker-compose.prod.yml stop

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Clean up old images
docker image prune -f

# View running containers
docker ps

# Database migrations
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec -T backend alembic current

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U tms_user tms_prod > backup_$(date +%Y%m%d).sql
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

## ⚠️ Common Issues

### Issue: "Docker credentials invalid"
```bash
# Update Docker Hub token
# Go to GitHub Settings → Secrets → Update DOCKER_PASSWORD
```

### Issue: "SSH connection failed"
```bash
# Test SSH connection
ssh -p 22 deploy@YOUR_VPS_IP "whoami"

# Add to known_hosts
ssh-keyscan -p 22 YOUR_VPS_IP >> ~/.ssh/known_hosts
```

### Issue: "Service failed to start"
```bash
ssh deploy@YOUR_VPS_IP
docker-compose -f docker-compose.prod.yml logs backend
# Check .env.production file
cat /opt/tms/.env.production
```

---

## 📝 File Locations

```
.github/
├── workflows/
│   └── ci.yml                    # Main workflow file
└── scripts/
    ├── deploy.sh                 # VPS deployment script
    └── setup-checker.sh          # Setup verification script

docs/
└── CI_CD_SETUP_GUIDE.md         # Detailed setup guide
```

---

## 🎯 When to Deploy

**Test (develop branch):**
- Feature development
- Bug fixes
- Testing changes

**Production (main branch):**
- After code review and approval
- After all tests pass
- Before merging to main

---

## 📚 Full Documentation

See `docs/CI_CD_SETUP_GUIDE.md` for:
- Detailed step-by-step setup
- Security best practices
- Troubleshooting guide
- Database migration steps
- Rollback procedures

