# 🚀 Getting Started: Local PostgreSQL Setup

**⏱️ Estimated Time: 5-10 minutes**

---

## Step 1: Verify Your OS & Choose Installation Method

### macOS (Homebrew - Easiest)
```bash
# Check if Homebrew is installed
brew --version

# If not installed, install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux (Ubuntu/Debian)
```bash
# You already have package manager
apt-get --version  # Should show version
```

### Windows
**You must use WSL2 (Windows Subsystem for Linux 2)**
- Follow: [LOCAL_POSTGRES_SETUP.md - Windows/WSL2 section](LOCAL_POSTGRES_SETUP.md#windows--wsl2-setup)

---

## Step 2: Install PostgreSQL

### macOS (Homebrew)

```bash
# Install PostgreSQL 16
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Verify it started
brew services list | grep postgresql
# Should show: postgresql@16 ... started
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on reboot

# Verify it started
sudo systemctl status postgresql
# Should show: active (running)
```

### Common Installation Issue?
See troubleshooting: [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md)

---

## Step 3: Create Database & User (2 Commands)

Copy and run these commands in your terminal:

```bash
# Create the database
createdb alumni_db

# Create the user and grant permissions
psql -d alumni_db << 'EOF'
CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
\q
EOF
```

**What happened:**
- ✅ Created database: `alumni_db`
- ✅ Created user: `alumni_user`
- ✅ Set password: `secure_password_change_me` (change this in production!)
- ✅ Granted all permissions

---

## Step 4: Verify It Works (3 Tests)

### Test 1: Direct Connection

```bash
# Connect as alumni_user
psql -U alumni_user -d alumni_db -c "SELECT 1;"

# Expected output:
#  ?column?
# ----------
#         1
# (1 row)
```

**If this works** ✅ → Proceed to Step 5

**If this fails** ❌ → Run troubleshooting:
- Password wrong? Reset it:
  ```bash
  psql -U postgres -d alumni_db -c \
    "ALTER USER alumni_user WITH PASSWORD 'secure_password_change_me';"
  ```
- Database doesn't exist? Create it:
  ```bash
  createdb alumni_db
  ```

### Test 2: Check Connection Info

```bash
psql -U alumni_user -d alumni_db -c "\conninfo"

# Expected:
# You are connected to database "alumni_db" as user "alumni_user" via socket in "/var/run/postgresql" at port 5432.
```

### Test 3: Connection String

```bash
# Verify localhost connection works
psql -h localhost -U alumni_user -d alumni_db -c "SELECT NOW();"

# Expected: Current timestamp
```

---

## Step 5: Update Application Configuration

```bash
# Go to project directory
cd ~/Personal\ Projects/TMS

# Backend environment file is already set up
# Verify it has the right password (from Step 3)
grep DATABASE_URL tms_be/.env.example

# If you used a different password than default:
# Edit tms_be/.env and update the password
nano tms_be/.env  # Or use your editor
```

**Should contain:**
```
DATABASE_URL=postgresql+asyncpg://alumni_user:secure_password_change_me@localhost:5432/alumni_db
```

---

## Step 6: Start the Application

```bash
# From project directory
cd ~/Personal\ Projects/TMS

# Start all services
docker-compose up -d

# Check services started
docker-compose ps

# Expected: All services showing "Up" ✅
```

**Services running:**
- 🟦 Redis (6379)
- 🟦 Backend (8000)
- 🟦 Frontend (5173)
- 🟨 PostgreSQL (localhost:5432 on host machine)

---

## Step 7: Access the Application

### Frontend
```
http://localhost:5173
```
Should show: Alumni Management System UI

### Backend API Documentation
```
http://localhost:8000/docs
```
Should show: Swagger/OpenAPI documentation

### Test API Connection

```bash
curl -s http://localhost:8000/health
# Expected: {"status": "ok"}
```

---

## ✅ Success Checklist

- [ ] PostgreSQL installed (`psql --version`)
- [ ] PostgreSQL running (`psql -U alumni_user -d alumni_db -c "SELECT 1;"`)
- [ ] Database created (`psql -l | grep alumni_db`)
- [ ] User created (`psql -U alumni_user -d alumni_db -c "SELECT 1;"`)
- [ ] Docker services running (`docker-compose ps`)
- [ ] Frontend accessible (http://localhost:5173)
- [ ] Backend API accessible (http://localhost:8000/docs)

**All checked? 🎉 You're ready to go!**

---

## Common Commands

### Daily Usage

```bash
# Start services
./start.sh

# Stop services
docker-compose down

# Check services status
docker-compose ps

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Connect to database
psql -U alumni_user -d alumni_db

# Verify PostgreSQL running
psql -U alumni_user -d alumni_db -c "SELECT 1;"
```

### Development

```bash
# Rebuild containers
docker-compose build

# Fresh start (warning: removes ALL data)
docker-compose down -v
./start.sh

# Debug backend connection
docker exec alumni_backend pg_isready -h host.docker.internal -U alumni_user
```

### Database Backup

```bash
# Backup
pg_dump -U alumni_user alumni_db > backup.sql

# Restore
psql -U alumni_user alumni_db < backup.sql
```

---

## 🚨 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| `psql: command not found` | PostgreSQL not installed - see Step 2 |
| `FATAL: the database system is in recovery...` | PostgreSQL crashed - restart it |
| `ROLE "alumni_user" does not exist` | User not created - run Step 3 |
| `Connection refused on port 5432` | PostgreSQL not running - see Step 2 |
| `password authentication failed` | Wrong password - Step 3 shows how to reset |
| Docker can't connect to DB | Ensure PostgreSQL is running - Step 4 Test 2 |
| `host.docker.internal: Name or service not known` | Linux only - add to /etc/hosts [see LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) |

For detailed troubleshooting: [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md)

---

## 📚 What's Next?

1. **Explore the API**: http://localhost:8000/docs
2. **Login to Frontend**: http://localhost:5173
3. **Read API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
4. **Understand Structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
5. **Learn Architecture**: [ARCHITECTURE_TRANSITION.md](ARCHITECTURE_TRANSITION.md)

---

## 🎯 How It Works

### Connection Flow

```
Your Application
    ↓
Docker Container (Backend)
    ↓
host.docker.internal (Docker magic DNS)
    ↓
localhost:5432 (Your Computer)
    ↓
PostgreSQL Database
```

### Passwords & Security

| Item | Value | Location | Change? |
|------|-------|----------|---------|
| DB User | `alumni_user` | Part of setup | ✅ Can change |
| DB Password | `secure_password_change_me` | `.env` file | ✅ **Must change in production** |
| DB Name | `alumni_db` | Setup | ❌ Don't change |
| Port | `5432` | Standard | ❌ Don't change |

---

## 🔒 Security Notes

### For Development ✅
- Use default passwords as shown
- localhost-only connection
- No external exposure
- Safe for testing

### For Production ⚠️
**MUST DO:**
1. Change all passwords to strong values
2. Use external PostgreSQL service (AWS RDS, etc.)
3. Enable SSL connections
4. Use environment variables for secrets
5. See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 🆘 Need Help?

### Quick Issues

**"It's not working!"**
1. Verify PostgreSQL running: `psql -U alumni_user -d alumni_db -c "SELECT 1;"`
2. Check Docker running: `docker ps`
3. View logs: `docker-compose logs -f backend`

**"I forgot the password!"**
```bash
# Reset it
psql -U postgres -d alumni_db -c \
  "ALTER USER alumni_user WITH PASSWORD 'new_password';"
```

**"Database is corrupted!"**
```bash
# Drop and recreate
dropdb alumni_db
createdb alumni_db
# Re-create user from Step 3
```

### Detailed Help
- [DATABASE_LOCAL_CONFIG.md](DATABASE_LOCAL_CONFIG.md) - Architecture & config
- [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) - Detailed setup per OS
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Full system setup
- [README.md](README.md) - Project overview

---

## ⏱️ Time Tracking

| Step | Time | Notes |
|------|------|-------|
| Step 1: OS Check | 1 min | Just verification |
| Step 2: PostgreSQL Install | 2-3 min | Automated by package manager |
| Step 3: Create DB & User | 1 min | Quick SQL commands |
| Step 4: Verify Setup | 2 min | Run test commands |
| Step 5: Config Update | 1 min | Usually already done |
| Step 6: Start Services | 3-5 min | Docker building images first time |
| Step 7: Access App | 1 min | Test URLs |
| **TOTAL** | **5-10 min** | First time; 1 min for subsequent runs |

---

## 📋 MacOS Quick Copy-Paste

Run these lines one at a time:

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL
brew services start postgresql@16

# Create database
createdb alumni_db

# Create user and grant permissions
psql -d alumni_db << 'EOF'
CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
\q
EOF

# Verify
psql -U alumni_user -d alumni_db -c "SELECT 1;"

# Go to project
cd ~/Personal\ Projects/TMS

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

**Then open browser to:** `http://localhost:5173`

---

## 📋 Linux Quick Copy-Paste

Run these lines one at a time:

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database (switch to postgres user)
sudo -u postgres createdb alumni_db

# Create user and grant permissions
sudo -u postgres psql -d alumni_db << 'EOF'
CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;
\q
EOF

# Verify
psql -U alumni_user -d alumni_db -h localhost -c "SELECT 1;"

# Go to project
cd ~/Personal\ Projects/TMS

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

**Then open browser to:** `http://localhost:5173`

---

## 🎓 Learning Path

1. **Day 1**: Complete this guide (now)
2. **Day 2**: Explore API → [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. **Day 3**: Understand code → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
4. **Later**: Deploy to production → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

**You're all set! 🚀**

Start with Step 1 above. Any issues? Check troubleshooting or detailed docs linked above.

**Happy developing!**
