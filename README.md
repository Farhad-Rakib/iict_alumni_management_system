# Alumni Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue)
![Node 18+](https://img.shields.io/badge/node-18%2B-green)
![Docker](https://img.shields.io/badge/Docker-20%2B-blue)

A comprehensive, production-ready web application for managing alumni networks, events, job boards, elections, and more.

## 🎯 Features

### Core Modules
- **Authentication & Access Control** - OTP-based email verification, JWT tokens, role-based access (5 roles)
- **Alumni Directory** - Search, filter, and connect with alumni; Privacy-controlled profiles
- **Events Management** - Create events, RSVP tracking, payment processing
- **Job Board** - Post and apply for jobs; Track applications
- **Notices & News** - Publish announcements with categories
- **Elections** - Secure voting system with real-time results
- **CMS** - Manage website pages, sliders, committee, gallery, contact info
- **Admin Dashboard** - Statistics, user management, content management

### Technical Features
- ✅ RESTful API with comprehensive documentation
- ✅ Real-time updates with React Query
- ✅ Role-based access control (RBAC)
- ✅ Async database operations for performance
- ✅ JWT authentication with refresh tokens
- ✅ Audit logging for important actions
- ✅ Email notifications (OTP, verification, notices)
- ✅ Rate limiting and security measures
- ✅ Docker containerization
- ✅ Docker Compose orchestration

## 🚀 Quick Start

### ⚠️ Important: PostgreSQL Setup Required

This project uses **local PostgreSQL** (not containerized). You must install and run PostgreSQL locally first.

**See [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) for detailed setup instructions.**

Quick setup:
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb alumni_db
psql -d alumni_db -c "CREATE USER alumni_user WITH PASSWORD 'secure_password_change_me';"
psql -d alumni_db -c "GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;"

# Verify it works
psql -U alumni_user -d alumni_db -h localhost -c "SELECT 1;"
```

### Using Docker Compose (Recommended)
```bash
# Clone repository
cd ~/Personal\ Projects/TMS

# Create environment files
cp tms_be/.env.example tms_be/.env
cp tms_ui/.env.example tms_ui/.env.local

# Start all services
docker-compose up -d

# Access applications
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Installation
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

## 📦 Technology Stack

### Backend
- **Framework:** FastAPI 0.104.1
- **Database:** PostgreSQL with SQLAlchemy 2.0.23
- **Authentication:** JWT (python-jose) + bcrypt
- **Validation:** Pydantic 2.5.0
- **Async:** Python async/await with asyncpg

### Frontend
- **Library:** React 18.2.0
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite 5.0.0
- **Styling:** Tailwind CSS 3.3.6
- **State:** Zustand + TanStack Query 5.28
- **HTTP Client:** Axios with interceptors
- **Routing:** React Router v6.20

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database:** PostgreSQL 14+
- **Cache:** Redis (optional)

## 📁 Project Structure

```
tms_be/                          # Backend (FastAPI)
├── app/
│   ├── api/v1/routes/          # API endpoints
│   ├── models/                 # Database models (24 tables)
│   ├── schemas/                # Pydantic DTOs (50+ schemas)
│   ├── services/               # Business logic (7 services)
│   ├── repositories/           # Data access layer
│   ├── dependencies/           # Dependency injection
│   ├── core/                   # Configuration & security
│   └── db/                     # Database configuration
├── migrations/                 # Alembic migrations
└── requirements.txt

tms_ui/                         # Frontend (React + TypeScript)
├── src/
│   ├── api/                    # API client
│   ├── pages/                  # Page components
│   ├── components/             # Reusable components
│   ├── modules/                # Feature modules
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # State management
│   ├── routes/                 # Route definitions
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global styles
├── public/                     # Static assets
└── package.json

docker-compose.yml             # Services orchestration
SETUP_GUIDE.md                 # Setup instructions
API_DOCUMENTATION.md           # API reference
PROJECT_STRUCTURE.md           # Folder structure
CONTRIBUTING.md                # Contribution guidelines
```

## 🔐 Security Features

- JWT authentication with expiring tokens
- OTP verification with 10-minute expiry
- Password hashing with bcrypt
- Account lockout after failed attempts
- SQL injection prevention via ORM
- CORS configuration
- Rate limiting
- Audit logging for sensitive operations
- Secure password reset flow

## 🧪 Testing

### Backend
```bash
cd tms_be
pytest
pytest --cov=app  # Coverage report
```

### Frontend
```bash
cd tms_ui
npm run test
npm run test:coverage
```

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Installation & configuration
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Folder structure & architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [tms_be/README.md](tms_be/README.md) - Backend-specific docs
- [tms_ui/README.md](tms_ui/README.md) - Frontend-specific docs

## 🔄 API Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| **Auth** | 8 endpoints (OTP, login, refresh, password reset) |
| **Alumni** | 7 endpoints (CRUD, search, profiles) |
| **Events** | 7 endpoints (CRUD, RSVP management) |
| **Jobs** | 6 endpoints (CRUD, applications) |
| **Notices** | 5 endpoints (CRUD, categories) |
| **Elections** | 8 endpoints (voting, results, candidates) |
| **CMS** | 10 endpoints (pages, sliders, gallery, contact) |

**Total:** 50+ REST endpoints

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

## 🚦 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/alumni_db
SECRET_KEY=your-secret-key
SMTP_SERVER=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Alumni Management System
```

See `.env.example` files for complete configuration.

## 🏗️ Architecture

### Clean Architecture Layers
1. **Presentation Layer** (React Components)
2. **API Layer** (FastAPI Routes)
3. **Business Logic** (Services)
4. **Data Access** (Repositories)
5. **Database** (PostgreSQL with SQLAlchemy)

### Design Patterns
- Repository Pattern - Data access abstraction
- Service Layer Pattern - Business logic isolation
- Dependency Injection - Loose coupling
- Factory Pattern - Object creation
- Observer Pattern - Event handling

## 📊 Database Schema

50+ database fields across 24 tables:
- **Users** - Authentication & profiles
- **Alumni** - Alumni profiles with privacy controls
- **Events** - Event management with RSVPs
- **Jobs** - Job postings and applications
- **Notices** - News and announcements
- **Elections** - Voting system with results
- **CMS** - Website content management

## 🔗 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "details": { ... }
}
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment
- Heroku, Railway, or similar
- AWS ECS, EKS
- Google Cloud Run
- Azure Container Instances

## 📈 Performance Considerations

- Async/await for non-blocking I/O
- Connection pooling for database
- Pagination for large datasets
- Query result caching
- Index optimization
- Frontend code splitting
- Component lazy loading

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Coding standards
- Development setup
- Testing requirements
- Pull request process
- Issue reporting guidelines

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Support

- 📖 **Documentation:** See README files and guides
- 🐛 **Bug Reports:** Open an issue with reproduction steps
- 💡 **Feature Requests:** Open a discussion for new ideas
- ❓ **Questions:** Check documentation first, then ask in discussions

## 🎯 Roadmap

### Completed ✅
- Backend scaffold with FastAPI
- Database models (24 tables)
- Authentication system
- All API routes (50+ endpoints)
- Frontend React setup
- Admin dashboard
- Docker setup

### In Progress 🔄
- Email notification service
- Advanced search functionality
- Payment gateway integration
- Automated testing

### Planned 📋
- Mobile app (React Native)
- Real-time notifications (WebSocket)
- Analytics dashboard
- Backup/restore functionality
- Multi-language support

## 📞 Contact

- Email: development@alumni.com
- GitHub: [Link to repository]
- Issues: [GitHub Issues]

## 🙏 Acknowledgments

- FastAPI community
- React community
- PostgreSQL documentation
- Contributors and testers

---

**Made with ❤️ for Alumni**

*Last Updated: January 2024*
*Version: 1.0.0*

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
