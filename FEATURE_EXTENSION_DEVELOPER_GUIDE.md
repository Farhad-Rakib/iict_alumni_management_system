# Feature Extension Developer Guide

This guide explains how to add a new feature to this system end-to-end:
- Backend (FastAPI + SQLAlchemy + Alembic)
- Frontend (React + TypeScript + TanStack Query)
- Dynamic menu and RBAC permissions

Use this as the standard workflow for all future modules.

---

## 1. Quick Start (Local Development)

### Start full stack

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose up -d --build
```

### Backend dev commands

```bash
cd tms_be
# if running locally without docker, install deps first
pip install -r requirements.txt
```

### Frontend dev commands

```bash
cd tms_ui
npm install
npm run dev
```

### Verify services
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

---

## 2. Extension Workflow Overview

When adding a new feature (example: `mentorship`), use this order:

1. Define backend model + migration.
2. Add backend schema (request/response DTOs).
3. Add backend service logic.
4. Add backend API route(s) and permission dependency.
5. Register route in API router.
6. Start backend and let RBAC permission sync discover route permissions.
7. Add frontend model + DTO.
8. Add frontend service interface + implementation + API export.
9. Build feature page(s).
10. Add route in frontend router with `PermissionGuard`.
11. Add menu entry in backend default menu seed.
12. Test role-based visibility and endpoint authorization.

---

## 3. Backend: Add a New Feature

## 3.1 Create model

Create a model in:
- `tms_be/app/models/<feature>.py`

Update:
- `tms_be/app/models/__init__.py`

Use current timestamp style compatible with existing schema:
- Prefer `datetime.utcnow` for `DateTime` columns currently mapped to timestamp without time zone.

## 3.2 Create Alembic migration

Create migration file under:
- `tms_be/migrations/versions/`

Then apply:

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose exec backend alembic upgrade head
```

## 3.3 Create schemas

Create DTOs in:
- `tms_be/app/schemas/<feature>.py`

Export in:
- `tms_be/app/schemas/__init__.py`

Keep request and response separate.

## 3.4 Create service and repository logic

Add business logic in:
- `tms_be/app/services/<feature>.py`

If needed, add repository helpers in:
- `tms_be/app/repositories/<feature>.py`

Route handlers should stay thin; validation and business rules belong in services.

## 3.5 Create API routes

Add route file:
- `tms_be/app/api/v1/routes/<feature>.py`

Use permission dependency on protected endpoints:

```python
Depends(require_permission("<resource>.<action>"))
```

Examples:
- `mentorship.read`
- `mentorship.create`
- `mentorship.update`
- `mentorship.delete`

For self-service actions, define explicit names like:
- `mentorship.request.create`
- `mentorship.request.approve`

## 3.6 Register API router

Include the new router in:
- `tms_be/app/api/v1/__init__.py`

---

## 4. RBAC and Permission Sync

Permissions are discovered/synced from routes at app startup.

Current bootstrap path:
- `tms_be/main.py`

If your new route uses `require_permission(...)`, it will be captured by sync and stored.

After adding routes, restart backend:

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose restart backend
```

Then verify in RBAC UI (or DB) that new permissions exist.

---

## 5. Menu Integration (Dynamic, Backend-Driven)

This project uses database-backed menu seeded from backend defaults.

Core files:
- `tms_be/app/models/menu.py`
- `tms_be/app/repositories/menu.py`
- `tms_be/app/services/menu.py`

Add new menu item in `DEFAULT_MENU_ITEMS` in:
- `tms_be/app/services/menu.py`

Example:

```python
{
    "id": "mentorship",
    "label": "Mentorship",
    "path": "/mentorship",
    "icon": "Users",
    "permissions": ["mentorship.read"],
}
```

Notes:
- `id` must be unique.
- `permissions` should match backend route permissions.
- For nested menus, use `children`.

Seed behavior adds missing keys without replacing existing DB rows, so new keys are inserted on next startup.

---

## 6. Frontend: Add a New Feature

## 6.1 Add domain model + DTO

Create:
- `tms_ui/src/domain/models/<feature>.model.ts`
- `tms_ui/src/domain/dto/<feature>.dto.ts`

Use camelCase in frontend, map snake_case from API in service layer.

## 6.2 Add service interface and implementation

Create:
- `tms_ui/src/core/services/<feature>.service.interface.ts`
- `tms_ui/src/core/services/impl/<feature>.service.ts`

In implementation:
- Extend `BaseRepository`.
- Set feature base path in constructor.
- Add mappers for request/response conversion.

## 6.3 Register in service factory and API export

Update:
- `tms_ui/src/core/services/service.factory.ts`

Add API accessor:
- `tms_ui/src/core/api/services/<feature>.api.ts`

## 6.4 Create feature page

Create page file under:
- `tms_ui/src/features/<feature>/pages/<Feature>Page.tsx`

Recommended pattern:
- `useQuery` for list/detail
- `useMutation` for create/update/delete
- `DataTable`, `Modal`, `DynamicForm`, `ConfirmDialog`

## 6.5 Add route and permission guard

Update:
- `tms_ui/src/app/router/index.tsx`

Add route using:

```tsx
<PermissionGuard permissions={['mentorship.read']}>
  <MentorshipPage />
</PermissionGuard>
```

Also update root redirect logic if feature should be an eligible landing page.

---

## 7. Naming Rules (Important)

Use consistent permission naming:
- Resource CRUD: `<resource>.create|read|update|delete`
- Nested actions: `<resource>.<subresource>.<action>`

Examples:
- `events.payments.read`
- `alumni.profile.edit` (legacy style can exist, but prefer normalized names for new features)

Keep endpoint path, permission names, menu permissions, and frontend guard permissions aligned.

---

## 8. End-to-End Checklist for New Feature

Backend checklist:
- [ ] Model added
- [ ] Migration created and applied
- [ ] Schemas added
- [ ] Service logic added
- [ ] Routes added with permission dependencies
- [ ] Router registered in API v1 init

RBAC/Menu checklist:
- [ ] Permissions discovered after backend restart
- [ ] Menu entry added in `DEFAULT_MENU_ITEMS`
- [ ] Menu visible for authorized role only

Frontend checklist:
- [ ] Model + DTO added
- [ ] Service interface + impl + API export added
- [ ] Feature page added
- [ ] Route added with `PermissionGuard`
- [ ] Root redirect updated if needed

Quality checklist:
- [ ] Backend endpoint test from `/docs`
- [ ] Frontend build passes
- [ ] Permission denied behavior verified
- [ ] Menu visibility verified for at least 2 roles

---

## 9. Validation Commands

### Frontend

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS/tms_ui
npm run build
```

### Backend quick smoke pattern

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
python3 - <<'PY'
import json, urllib.request

base='http://localhost:8000/api/v1'
login=urllib.request.Request(
    f'{base}/auth/login',
    data=json.dumps({'email':'superadmin@alumni.com','password':'SuperAdmin@123'}).encode(),
    headers={'Content-Type':'application/json'},
    method='POST'
)
with urllib.request.urlopen(login) as r:
    token=json.loads(r.read().decode())['access_token']

req=urllib.request.Request(
    f'{base}/menu',
    headers={'Authorization': f'Bearer {token}'},
    method='GET'
)
with urllib.request.urlopen(req) as r:
    print(r.status)
    print(r.read().decode()[:300])
PY
```

---

## 10. Common Pitfalls and How to Avoid

1. Permission mismatch between backend and frontend
- Always reuse exact permission strings in route dependency, menu config, and `PermissionGuard`.

2. 500 errors from FK relations
- Validate existence in service layer first and return `404`/`400` instead of relying on DB error.

3. Timezone datetime errors
- Match model defaults with DB column type (current project commonly uses naive UTC with `datetime.utcnow`).

4. Menu not showing
- Check user has required permission.
- Check menu item key/path exists in `DEFAULT_MENU_ITEMS`.
- Restart backend and verify menu endpoint response.

5. Feature compiles but not reachable
- Route may be missing in `tms_ui/src/app/router/index.tsx`.
- API router may be missing in `tms_be/app/api/v1/__init__.py`.

---

## 11. Suggested Pull Request Template for New Feature

Include these sections in PR description:
- Feature summary
- Backend changes (models/schemas/services/routes/migrations)
- Frontend changes (models/dto/services/pages/routes)
- Permissions added
- Menu changes
- Test evidence (commands + results)
- Rollback notes

---

## 12. Where to Place Future Developer Docs

Recommended:
- Extension workflow docs: repo root (like this file)
- Module-specific docs: inside module folder or root docs with clear name
- Keep docs short, actionable, and aligned to current code paths

---

If you follow this guide for each new module, feature delivery stays consistent with the current architecture and avoids permission/menu drift.
