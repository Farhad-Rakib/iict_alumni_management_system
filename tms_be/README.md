"""
Alumni Management System - Backend API
=====================================

A production-ready fastapi backend for alumni management with complete authentication,
role-based access control, and comprehensive module management.

## Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. Clone the repository
```bash
cd tms_be
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application
```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

### Folder Structure
```
app/
├── api/v1/routes/        # API route handlers
├── core/                 # Configuration, security utils
├── models/               # SQLAlchemy models
├── schemas/              # Pydantic DTOs
├── repositories/         # Data access layer
├── services/             # Business logic layer
├── dependencies/         # Dependency injection
├── db/                   # Database configuration
├── modules/              # Feature-specific modules
│   ├── auth/
│   ├── users/
│   ├── alumni/
│   ├── events/
│   ├── jobs/
│   ├── notices/
│   ├── elections/
│   └── cms/
└── migrations/           # Alembic migrations
```

### Architecture Pattern
- **Controllers (Routes)**: Handle HTTP requests, delegate to services
- **Services**: Contain business logic, coordinate repositories
- **Repositories**: Handle database operations, return models
- **Models**: SQLAlchemy ORM models
- **Schemas**: Pydantic DTOs for validation

## API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to email
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/set-password` - Set password for new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Alumni
- `POST /api/v1/alumni/create` - Create alumni (Admin)
- `GET /api/v1/alumni/directory` - Search alumni directory
- `GET /api/v1/alumni/{id}` - Get alumni by ID
- `GET /api/v1/alumni/profile/me` - Get current user's profile
- `PUT /api/v1/alumni/profile/me` - Update current user's profile
- `PUT /api/v1/alumni/{id}` - Update alumni (Admin)
- `DELETE /api/v1/alumni/{id}` - Delete alumni (Admin)

### Events
- `POST /api/v1/events/` - Create event
- `GET /api/v1/events/` - List events
- `GET /api/v1/events/{id}` - Get event
- `PUT /api/v1/events/{id}` - Update event
- `DELETE /api/v1/events/{id}` - Delete event
- `POST /api/v1/events/{id}/rsvp` - RSVP for event
- `GET /api/v1/events/{id}/rsvps` - Get event RSVPs

### Jobs
- `POST /api/v1/jobs/` - Create job
- `GET /api/v1/jobs/` - List jobs
- `GET /api/v1/jobs/{id}` - Get job
- `PUT /api/v1/jobs/{id}` - Update job
- `DELETE /api/v1/jobs/{id}` - Delete job
- `POST /api/v1/jobs/{id}/apply` - Apply for job
- `GET /api/v1/jobs/{id}/applications` - Get applications

### Notices
- `GET /api/v1/notices/categories` - Get categories
- `POST /api/v1/notices/categories` - Create category
- `POST /api/v1/notices/` - Create notice
- `GET /api/v1/notices/` - List notices
- `GET /api/v1/notices/{id}` - Get notice
- `PUT /api/v1/notices/{id}` - Update notice
- `DELETE /api/v1/notices/{id}` - Delete notice

### Elections
- `POST /api/v1/elections/` - Create election
- `GET /api/v1/elections/` - List elections
- `GET /api/v1/elections/{id}` - Get election
- `POST /api/v1/elections/{id}/positions` - Add position
- `GET /api/v1/elections/{id}/positions` - Get positions
- `POST /api/v1/elections/{position_id}/candidates` - Add candidate
- `GET /api/v1/elections/{position_id}/candidates` - Get candidates
- `POST /api/v1/elections/{id}/vote` - Cast vote
- `GET /api/v1/elections/{id}/results` - Get results

### CMS
- `POST /api/v1/cms/pages` - Create page
- `GET /api/v1/cms/pages/{slug}` - Get page by slug
- `PUT /api/v1/cms/pages/{id}` - Update page
- `POST /api/v1/cms/sliders` - Create slider
- `GET /api/v1/cms/sliders` - Get sliders
- `PUT /api/v1/cms/sliders/{id}` - Update slider
- `POST /api/v1/cms/committee` - Add committee member
- `GET /api/v1/cms/committee` - Get committee
- `PUT /api/v1/cms/committee/{id}` - Update member
- `POST /api/v1/cms/gallery` - Upload gallery image
- `GET /api/v1/cms/gallery` - Get gallery
- `GET /api/v1/cms/contact` - Get contact info
- `PUT /api/v1/cms/contact/{id}` - Update contact

## Authentication

The system uses JWT (JSON Web Tokens) with access and refresh tokens.

### Authentication Flow
1. User receives OTP via email
2. User verifies OTP
3. User sets password
4. User logs in with email/password → receives tokens
5. Access token used for authenticated requests
6. Refresh token used to get new access token

### Token Headers
```
Authorization: Bearer <access_token>
```

## Role-Based Access Control

Roles available:
- `superadmin` - Full system access
- `admin` - Full admin functions
- `alumni` - Standard user
- `event_manager` - Event management
- `election_manager` - Election management

## Development

### Running Tests
```bash
pytest
```

### Creating Migrations
```bash
alembic revision --autogenerate -m "migration_name"
alembic upgrade head
```

### Database Setup
```bash
# Initialize database
python -c "from app.db.base import init_db; import asyncio; asyncio.run(init_db())"
```

## Performance Considerations

- Async/await used throughout for non-blocking I/O
- Connection pooling for database
- Redis caching support (ready to implement)
- Pagination for large datasets
- Indexed queries for search performance

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- OTP verification (6-digit, 10-minute expiry)
- Account lockout after failed attempts
- CORS configuration
- SQL injection prevention via SQLAlchemy ORM
- Secure password reset flow

## Environment Variables

See `.env.example` for complete configuration.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `SMTP_SERVER`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration
- `CORS_ORIGINS` - Allowed origins for CORS

## Production Deployment

1. Set `DEBUG = False`
2. Change `SECRET_KEY` to a strong random string
3. Configure email services
4. Use environment-specific `.env`
5. Set up rate limiting
6. Configure logging
7. Use production WSGI server (Gunicorn)
8. Set up HTTPS/SSL
9. Configure database backups
10. Set up monitoring

## Support

For issues or questions, contact the development team or create an issue in the repository.
