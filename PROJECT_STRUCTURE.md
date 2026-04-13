"""
PROJECT STRUCTURE
=================

Alumni Management System
├── tms_be/                          # Backend (FastAPI)
│   ├── main.py                      # Application entry point
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                 # Environment template
│   ├── Dockerfile                   # Docker configuration
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes/
│   │   │           ├── __init__.py
│   │   │           ├── auth.py
│   │   │           ├── alumni.py
│   │   │           ├── event.py
│   │   │           ├── job.py
│   │   │           ├── notice.py
│   │   │           ├── election.py
│   │   │           └── cms.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Settings configuration
│   │   │   ├── security.py          # JWT & password security
│   │   │   └── utils.py             # Utility functions
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User & auth models
│   │   │   ├── alumni.py
│   │   │   ├── event.py
│   │   │   ├── job.py
│   │   │   ├── notice.py
│   │   │   ├── election.py
│   │   │   └── cms.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Auth DTOs
│   │   │   ├── alumni.py
│   │   │   ├── event.py
│   │   │   ├── job.py
│   │   │   ├── notice.py
│   │   │   ├── election.py
│   │   │   └── cms.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # Base repository
│   │   │   └── user.py              # User repository
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Auth business logic
│   │   │   ├── alumni.py
│   │   │   ├── event.py
│   │   │   ├── job.py
│   │   │   ├── notice.py
│   │   │   ├── election.py
│   │   │   └── cms.py
│   │   ├── dependencies/
│   │   │   ├── __init__.py
│   │   │   └── auth.py              # Auth dependency injection
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── base.py              # Database configuration
│   │   └── migrations/
│   │       └── alembic.ini          # Database migrations
│   └── uploads/                     # File uploads directory
│
├── tms_ui/                          # Frontend (React + TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js
│   ├── index.html
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Main app component
│   │   ├── api/
│   │   │   └── client.ts            # Axios API client
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Auth hooks
│   │   │   └── useQuery.ts          # Query hooks
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── ...other pages
│   │   ├── components/
│   │   │   ├── common/              # Reusable components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── ...
│   │   │   └── layout/              # Layout components
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── modules/                 # Feature modules
│   │   │   ├── auth/
│   │   │   ├── alumni/
│   │   │   ├── events/
│   │   │   ├── jobs/
│   │   │   ├── notices/
│   │   │   ├── elections/
│   │   │   └── admin/
│   │   ├── store/
│   │   │   ├── auth.ts              # Auth store (Zustand)
│   │   │   └── ...other stores
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx   # Protected route wrapper
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   └── constants.ts
│   │   └── styles/
│   │       └── globals.css          # Global styles
│
├── docker-compose.yml               # Full stack compose
├── SETUP_GUIDE.md                   # Setup instructions
├── API_DOCUMENTATION.md             # API reference
├── PROJECT_STRUCTURE.md             # This file
└── README.md                        # Project overview

## Key Features by Module

### Authentication & Users
- OTP-based email verification
- JWT token authentication
- Password reset flow
- Account lockout protection
- Login audit logs

### Alumni Management
- Complete profile management
- Privacy level settings (public/alumni-only/private)
- Advanced search and filtering
- Batch and department tracking
- Professional information

### Events Management
- Event creation and scheduling
- RSVP/registration system
- Paid/free event support
- Capacity management
- Payment tracking

### Job Board
- Job posting and management
- Application tracking
- Filter by location, skills, experience
- Internal/external applications
- Job expiry handling

### Notices & News
- Notice publishing
- Category management
- Rich content support
- View tracking
- Expiry scheduling

### Elections & Voting
- Election setup and management
- Candidate management
- Secure voting system
- Duplicate vote prevention
- Live result calculation
- Audit logging

### CMS (Content Management)
- Page management
- Slider/carousel management
- Committee member profiles
- Gallery management
- Contact information management

## Technology Stack

### Backend
- FastAPI - Web framework
- PostgreSQL - Database
- SQLAlchemy - ORM
- Pydantic - Data validation
- JWT - Authentication
- Alembic - Migrations
- Async/Await - Asynchronous operations

### Frontend
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool
- React Router - Navigation
- TanStack Query - Data fetching
- Zustand - State management
- Tailwind CSS - Styling
- Axios - HTTP client

### Infrastructure
- Docker - Containerization
- Docker Compose - Orchestration
- Redis - Caching (pre-configured)

## Development Guidelines

### Code Structure
- Clean Architecture pattern
- Separation of concerns
- Dependency injection
- Middleware for cross-cutting concerns
- Comprehensive error handling

### Best Practices
- Async/await for non-blocking operations
- Connection pooling
- Input validation at multiple layers
- Comprehensive logging
- Rate limiting ready

### Testing
- Unit tests for services
- Integration tests for APIs
- End-to-end tests for flows

### Security
- Password hashing with bcrypt
- JWT with expiration
- CORS configuration
- SQL injection prevention
- XSS protection
- CSRF tokens (when needed)

## Performance Considerations

- Pagination for large datasets
- Indexed database queries
- Redis caching support
- Async database operations
- Connection pooling
- Frontend code splitting
- Lazy loading of components

## Deployment Architecture

```
                    Load Balancer
                         |
        +--------+--------+--------+
        |        |        |        |
    Frontend  Frontend  Backend  Backend
    (Node)    (Node)    (Gunicorn)(Gunicorn)
        |        |        |        |
        +--------+---+----+--------+
                     |
                PostgreSQL
                     |
                    Redis
```

## Maintenance & Operations

- Automated backups
- Log aggregation
- Performance monitoring
- Error tracking
- Health checks
- Database optimization
- Cache invalidation

For detailed setup instructions, see SETUP_GUIDE.md
For API documentation, see API_DOCUMENTATION.md
