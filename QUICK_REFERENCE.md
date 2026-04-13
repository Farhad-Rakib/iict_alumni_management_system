"""
DEVELOPER QUICK REFERENCE
==========================

Essential commands and patterns for Alumni Management System development.

## Quick Start

### Option 1: Docker (Recommended)
```bash
# Make scripts executable
chmod +x *.sh

# Setup environment
./setup.sh

# Start all services
./start.sh

# Access at http://localhost:5173
```

### Option 2: Manual Setup
```bash
# Backend
cd tms_be
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd tms_ui
npm install
npm run dev
```

---

## Common Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Backend only
docker-compose logs -f frontend          # Frontend only

# Stop services
docker-compose down                       # Keep volumes
docker-compose down -v                    # Delete volumes

# Rebuild services
docker-compose up -d --build

# View status
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend bash

# Clean up everything
./cleanup.sh
```

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run application
uvicorn main:app --reload              # With auto-reload
uvicorn main:app --reload --port 8001  # Custom port

# Run tests
pytest
pytest -v                    # Verbose
pytest --cov=app            # With coverage
pytest tests/test_auth.py    # Specific test

# Format code
black app/
autopep8 --in-place -r app/

# Type checking
mypy app/

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Database shell
python
>>> from app.db.base import AsyncSessionLocal
>>> import asyncio
```

### Frontend Development

```bash
# Install dependencies
npm install

# Development server
npm run dev                  # Start dev server
npm run preview            # Production build preview

# Building
npm run build              # Production build
npm run build --prod       # Same as above

# Testing
npm run test              # Run tests
npm run test:coverage     # With coverage

# Linting
npm run lint              # Check for issues
npm run lint -- --fix     # Auto-fix issues

# Format code
npm run format            # Format with Prettier
```

---

## Project Structure Navigation

### Backend

```
tms_be/app/
├── api/v1/routes/         → API endpoints (edit here for new routes)
├── models/                → Database models (entities)
├── schemas/               → Data validation DTOs
├── services/              → Business logic (edit for features)
├── repositories/          → Database queries
├── dependencies/          → Auth & injection
└── core/                  → Configuration & utilities
```

**Adding new endpoint:**
```
1. Create model in models/
2. Create schema in schemas/
3. Create service in services/
4. Create repository (if needed)
5. Add route in api/v1/routes/
```

### Frontend

```
tms_ui/src/
├── api/                   → API client methods
├── pages/                 → Page components
├── components/            → Reusable components
├── modules/               → Feature groupings
├── store/                 → State management (Zustand)
├── hooks/                 → Custom React hooks
├── types/                 → TypeScript types
└── styles/                → Global CSS
```

**Adding new page:**
```
1. Create .tsx file in pages/
2. Add types in types/
3. Add route in App.tsx
4. Add navigation in Header.tsx
```

---

## API Development Patterns

### Creating New Endpoint

**Model (app/models/example.py):**
```python
from sqlalchemy import Column, String, DateTime
from app.db.base import Base

class Example(Base):
    __tablename__ = "examples"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Schema (app/schemas/example.py):**
```python
from pydantic import BaseModel

class ExampleCreate(BaseModel):
    name: str

class ExampleResponse(BaseModel):
    id: str
    name: str
```

**Service (app/services/example.py):**
```python
from app.repositories import BaseRepository
from app.models.example import Example

class ExampleService:
    def __init__(self, db_session):
        self.repo = BaseRepository(Example, db_session)
    
    async def create(self, data: dict) -> Example:
        return await self.repo.create(Example(**data))
```

**Route (app/api/v1/routes/example.py):**
```python
from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user
from app.services import ExampleService

router = APIRouter(prefix="/examples", tags=["examples"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_example(
    data: dict,
    current_user = Depends(get_current_user),
    service: ExampleService = Depends(get_example_service)
):
    example = await service.create(data)
    return {"success": True, "data": example}
```

---

## Frontend Development Patterns

### Creating New Hook

```typescript
// hooks/useExample.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useExamples() {
  const query = useQuery({
    queryKey: ['examples'],
    queryFn: () => apiClient.get('/examples'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/examples', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
    },
  });

  return { ...query, createMutation };
}
```

### Using Hook in Component

```typescript
// pages/ExamplesPage.tsx
import { useExamples } from '@/hooks/useExample';

export function ExamplesPage() {
  const { data, isLoading, createMutation } = useExamples();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={() => createMutation.mutate({name: 'New'})}>
        Create
      </button>
    </div>
  );
}
```

### Creating Reusable Component

```typescript
// components/common/ExampleCard.tsx
interface ExampleCardProps {
  id: string;
  name: string;
  onClick?: () => void;
}

export function ExampleCard({ id, name, onClick }: ExampleCardProps) {
  return (
    <div className="card p-4" onClick={onClick}>
      <h3 className="font-bold">{name}</h3>
    </div>
  );
}
```

---

## Database Management

### Create Migration

```bash
cd tms_be

# Make model changes first, then:
alembic revision --autogenerate -m "Add new column to table"

# Review generated file in migrations/versions/
# Apply migration
alembic upgrade head
```

### Rollback Migration

```bash
# Back one version
alembic downgrade -1

# Back to specific version
alembic downgrade <revision_id>

# Back to beginning
alembic downgrade base
```

### Database Query

```python
from app.repositories import BaseRepository
from app.models.user import User

# In a service or route
async with AsyncSessionLocal() as session:
    repo = BaseRepository(User, session)
    
    # Get all
    users = await repo.get_all()
    
    # Get single
    user = await repo.get_by_id(user_id)
    
    # Create
    new_user = await repo.create(User(email="test@example.com"))
    
    # Update
    updated = await repo.update(user_id, {"name": "New Name"})
    
    # Delete
    await repo.delete(user_id)
    
    # Custom query
    await session.execute(select(User).where(User.email == "test@example.com"))
```

---

## Testing

### Backend Tests

```python
# tests/test_services.py
import pytest
from app.services import AuthService

@pytest.fixture
def auth_service():
    return AuthService()

@pytest.mark.asyncio
async def test_send_otp(auth_service):
    result = await auth_service.send_otp("test@example.com")
    assert result is True
```

**Run tests:**
```bash
pytest
pytest -v --tb=short
pytest tests/test_auth.py
pytest -k "test_send" -v
```

### Frontend Tests

```typescript
// tests/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '@/hooks/useAuth';

test('login should work', async () => {
  const { result } = renderHook(() => useLogin());
  
  await act(async () => {
    await result.current.mutate({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  expect(result.current.isSuccess).toBe(true);
});
```

**Run tests:**
```bash
npm run test
npm run test -- --watch
npm run test -- --coverage
```

---

## Debugging

### Backend Debugging

**Using print statements:**
```python
print(f"Debug value: {variable}")
logger.info(f"Event: {event}")
logger.error(f"Error: {error}")
```

**Using debugger:**
```python
import pdb; pdb.set_trace()  # Breakpoint

# In terminal
python -m pdb script.py
(Pdb) n  # Next
(Pdb) s  # Step
(Pdb) c  # Continue
(Pdb) p variable  # Print value
```

**View logs:**
```bash
# Docker
docker-compose logs -f backend

# Local development
tail -f backend.log  # If logging to file
```

### Frontend Debugging

**Browser DevTools:**
- Open DevTools: F12 or Cmd+Option+I
- Console tab for errors
- Network tab for API calls
- Elements tab for DOM inspection
- Application tab for localStorage

**React DevTools:**
- Install React Developer Tools extension
- Inspect components and state

**Debugging with VS Code:**
```json
# In launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}"
}
```

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/alumni_db
SECRET_KEY=your-secret-key-here
SMTP_SERVER=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
DEBUG=True  # Set to False in production
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Alumni Management System
```

---

## Performance Tips

### Backend
- Use async/await everywhere
- Index frequently queried columns
- Use connection pooling
- Cache frequently accessed data
- Use pagination for large datasets

### Frontend
- Use React Query for caching
- Lazy load components
- Memoize expensive calculations
- Split code by routes
- Optimize images

---

## Useful Links

- **Backend**: http://localhost:8000/docs (Swagger UI)
- **Frontend**: http://localhost:5173
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Common Issues & Solutions

### Can't connect to database
```bash
# Check PostgreSQL is running
psql -U postgres

# Check connection string
echo $DATABASE_URL

# Verify database exists
psql -U postgres -l | grep alumni
```

### Port already in use
```bash
# Find process
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Module import errors
```bash
# Backend
pip install -r requirements.txt
# Clear cache
find . -type d -name __pycache__ -exec rm -r {} + || true

# Frontend
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
# Check TypeScript
npm run type-check

# Enable strict mode in tsconfig.json if not already enabled
```

---

## Key Passwords & Credentials

**For Local Development:**
```
Database:  postgres / password
Email:     (set in .env)
JWT Key:   (generated in .env)
```

**Never commit credentials!** Use .env.example as template.

---

## Version Management

**Current Versions:**
- Python 3.11+
- Node 18+
- FastAPI 0.104.1
- React 18.2.0
- PostgreSQL 14+

---

## Getting Help

1. Check documentation files (README.md, etc.)
2. Review existing code patterns
3. Check GitHub issues
4. Ask in team discussions
5. Review API documentation (http://localhost:8000/docs)

---

## Useful Aliases (Optional)

Add to ~/.bashrc or ~/.zshrc:

```bash
alias tms_start='cd ~/Personal\ Projects/TMS && ./start.sh'
alias tms_clean='cd ~/Personal\ Projects/TMS && ./cleanup.sh'
alias tms_logs='cd ~/Personal\ Projects/TMS && docker-compose logs -f'
alias tms_backend='cd ~/Personal\ Projects/TMS/tms_be && source venv/bin/activate'
alias tms_frontend='cd ~/Personal\ Projects/TMS/tms_ui && npm run dev'
```

Then use:
```bash
tms_start        # Start services
tms_clean        # Cleanup
tms_logs         # View logs
tms_backend      # Activate backend venv
```

---

Last Updated: January 2024
For detailed information, see the main README and documentation files.
"""
