"""
Production Deployment Checklist
================================

Complete checklist for deploying Alumni Management System to production.

## Pre-Deployment (1-2 days before)

### Code Readiness
- [ ] All tests passing (backend & frontend)
- [ ] Code review completed
- [ ] Linting passed
- [ ] TypeScript compilation successful
- [ ] No console warnings
- [ ] All features merged to main branch
- [ ] Version bumped (if applicable)

### Documentation
- [ ] README.md updated
- [ ] API documentation current
- [ ] CHANGELOG.md updated with new features
- [ ] Deployment instructions reviewed
- [ ] Environment variables documented

### Database
- [ ] Migration scripts reviewed
- [ ] Database backup scheduled
- [ ] Rollback plan documented
- [ ] Database size estimated
- [ ] Indexes verified

### Security Review
- [ ] No hardcoded secrets in code
- [ ] CORS properly configured
- [ ] HTTPS/SSL certificate ready
- [ ] Password policies reviewed
- [ ] JWT token expiry appropriate
- [ ] Rate limiting configured
- [ ] CSRF protection enabled (if needed)

## Day Before Deployment

### Infrastructure
- [ ] Server resources verified (CPU, RAM, disk)
- [ ] Network connectivity tested
- [ ] Firewall rules configured
- [ ] DNS records prepared
- [ ] CDN configured (if applicable)
- [ ] Load balancer tested

### Monitoring & Logging
- [ ] Application monitoring set up
- [ ] Log aggregation configured
- [ ] Error tracking (Sentry) ready
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alerting rules defined

### Backups & Recovery
- [ ] Full database backup
- [ ] Application code backup
- [ ] Configuration backup
- [ ] Rollback procedures documented
- [ ] Recovery time estimated

### Communication
- [ ] Team briefed on deployment plan
- [ ] On-call schedule established
- [ ] Status page updated (if applicable)
- [ ] User notification prepared (if needed)

## Deployment Day - 1 Hour Before

### Final Checks
- [ ] Deployment window confirmed
- [ ] All team members ready
- [ ] Communication channels open
- [ ] Database backup completed (final)
- [ ] Code frozen (no new commits)
- [ ] Staging environment matches production config

### Environment Variables
- [ ] .env file created with production values
- [ ] SECRET_KEY is strong random string
- [ ] DATABASE_URL verified
- [ ] SMTP credentials configured
- [ ] CORS_ORIGINS set correctly
- [ ] DEBUG = False
- [ ] All required variables present

### Database Migration
- [ ] Migration scripts validated
- [ ] Backup of pre-migration state taken
- [ ] Rollback migration tested locally
- [ ] Migration run time estimated

## Deployment Steps

### 1. Pre-Deployment Snapshot
```bash
# Backup database
pg_dump -U postgres alumni_db > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Note current state
git log --oneline -1

# Check system resources
df -h
free -m
uptime
```

### 2. Deploy Backend
```bash
# [ ] Stop current backend service
sudo systemctl stop alumni-backend

# [ ] Pull latest code
cd /var/www/alumni/tms_be
git pull origin main

# [ ] Install dependencies
pip install -r requirements.txt

# [ ] Run migrations
alembic upgrade head

# [ ] Run any seed scripts (if needed)

# [ ] Start backend service
sudo systemctl start alumni-backend

# [ ] Verify backend health
curl http://localhost:8000/health
```

### 3. Deploy Frontend
```bash
# [ ] Build frontend
cd /var/www/alumni/tms_ui
npm install
npm run build

# [ ] Backup old build
sudo cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# [ ] Copy new build to web server
sudo cp -r dist/* /var/www/html/

# [ ] Clear cache
sudo systemctl restart nginx
```

### 4. Verification
```bash
# [ ] Check backend API
curl http://localhost:8000/docs

# [ ] Check frontend
curl http://localhost:5173

# [ ] Test login flow
# [ ] Test core features
# [ ] Check error handling
# [ ] Verify database connectivity

# [ ] Monitor logs
tail -f /var/log/alumni/backend.log
tail -f /var/log/alumni/frontend.log
```

### 5. Health Checks
- [ ] API responds with 200 OK
- [ ] Database queries working
- [ ] Authentication system functional
- [ ] Email notifications sending
- [ ] File uploads working
- [ ] Static files loading
- [ ] No 5xx errors in logs

## Post-Deployment (First 2 Hours)

### Active Monitoring
- [ ] Monitor application logs continuously
- [ ] Check error tracking system
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Check database query performance
- [ ] Monitor network traffic
- [ ] Review user feedback

### Testing
- [ ] [ ] Test all major user flows:
  - [ ] User registration & OTP verification
  - [ ] Alumni profile creation/update
  - [ ] Event RSVP
  - [ ] Job application
  - [ ] Voting in elections
  - [ ] Admin functions

### Communication
- [ ] [ ] Notify stakeholders of successful deployment
- [ ] [ ] Update status page
- [ ] [ ] Share deployment notes with team
- [ ] [ ] Document any issues encountered

## Rollback Procedure (If Needed)

### Quick Rollback (< 15 minutes)
```bash
# 1. Restore from backup
pg_restore alumni_db < backup_prod_20240115_100000.sql

# 2. Checkout previous version
git checkout previous_tag

# 3. Restart services
sudo systemctl restart alumni-backend
sudo systemctl restart nginx
```

### Full Rollback Process
1. [ ] Stop current services
2. [ ] Restore database from backup
3. [ ] Revert code to previous tag
4. [ ] Run previous version migrations (if needed)
5. [ ] Verify all systems operational
6. [ ] Update monitoring/alerting
7. [ ] Post-mortem meeting scheduled

## Post-Deployment (Next 24 Hours)

### Stability Verification
- [ ] No new errors in logs
- [ ] Performance metrics normal
- [ ] Database size as expected
- [ ] Backup completion verified
- [ ] All services running smoothly

### Monitoring
- [ ] Check daily active users
- [ ] Monitor API response times
- [ ] Review error rates
- [ ] Check database performance
- [ ] Verify email sending

### Documentation
- [ ] [ ] Update deployment log
- [ ] [ ] Document any issues/resolutions
- [ ] [ ] Update runbooks if needed
- [ ] [ ] Schedule post-deployment review

## Weekly Post-Deployment

- [ ] Review error logs
- [ ] Check feature adoption
- [ ] Monitor performance trends
- [ ] Plan next improvements
- [ ] Gather user feedback

## Emergency Contact Info

**On-Call Engineer:** [Name] [Phone] [Email]
**Team Lead:** [Name] [Phone] [Email]
**Infrastructure:** [Name] [Phone] [Email]
**Database Admin:** [Name] [Phone] [Email]

## Important URLs

- Application: https://alumni.example.com
- Admin Panel: https://alumni.example.com/admin
- API Docs: https://api.alumni.example.com/docs
- Monitoring: https://monitoring.example.com
- Logs: https://logs.example.com

## Important Files & Locations

```
/var/www/alumni/              # Application root
├── tms_be/                   # Backend
├── tms_ui/                   # Frontend build
└── backups/                  # Database backups

/etc/alumni/                  # Configuration
├── .env.production           # Environment variables
└── nginx.conf               # Web server config

/var/log/alumni/             # Logs
├── backend.log
└── frontend.log
```

## Deployment Commands Quick Reference

```bash
# View current output
tail -f /var/log/alumni/backend.log

# Check system status
systemctl status alumni-backend
systemctl status nginx

# Database status
psql -U postgres -d alumni_db -c "SELECT version();"

# Quick health check
curl http://localhost:8000/health

# Restart services
sudo systemctl restart alumni-backend
sudo systemctl restart nginx
```

## Success Criteria

Deployment is considered successful when:
- ✅ All services are running
- ✅ No critical errors in logs
- ✅ All health checks pass
- ✅ User flows work as expected
- ✅ Performance is acceptable
- ✅ Monitoring shows normal metrics

## Sign-Off

- [ ] Backend Engineer: _____________ Date: _______
- [ ] Frontend Engineer: _____________ Date: _______
- [ ] DevOps Engineer: _____________ Date: _______
- [ ] QA Lead: _____________ Date: _______
- [ ] Project Manager: _____________ Date: _______

---

For detailed guidance, refer to SETUP_GUIDE.md and README.md
Last Updated: January 2024
"""
