# Dev Guide

This is the quick developer guide for extending the system with new features.

## 1. Run the Project

### Full stack with Docker

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose up -d --build
```

### Backend only (local)

```bash
cd tms_be
pip install -r requirements.txt
```

### Frontend only (local)

```bash
cd tms_ui
npm install
npm run dev
```

### Useful URLs
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

---

## 2. Backend Feature Extension Steps

Follow this order for any new module (example: `mentorship`).

1. Add model in `tms_be/app/models/mentorship.py`
2. Export model in `tms_be/app/models/__init__.py`
3. Add migration in `tms_be/migrations/versions/`
4. Add schema(s) in `tms_be/app/schemas/mentorship.py`
5. Add service logic in `tms_be/app/services/mentorship.py`
6. Add route(s) in `tms_be/app/api/v1/routes/mentorship.py`
7. Register router in `tms_be/app/api/v1/__init__.py`
8. Restart backend and verify endpoint in `/docs`

### Migration apply

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose exec backend alembic upgrade head
```

### Route permission pattern

Use permission dependencies on protected endpoints:

```python
Depends(require_permission("mentorship.read"))
Depends(require_permission("mentorship.create"))
Depends(require_permission("mentorship.update"))
Depends(require_permission("mentorship.delete"))
```

---

## 3. RBAC and Permission Sync

Permissions are synced from routes at startup.

- If your route has `require_permission(...)`, it will be discoverable by RBAC sync.
- Restart backend after route changes:

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS
docker compose restart backend
```

---

## 4. Add Feature to Dynamic Menu

Menu is backend-driven and DB-seeded.

Edit:
- `tms_be/app/services/menu.py`

Add your item inside `DEFAULT_MENU_ITEMS`:

```python
{
    "id": "mentorship",
    "label": "Mentorship",
    "path": "/mentorship",
    "icon": "Users",
    "permissions": ["mentorship.read"],
}
```

Then restart backend so seed/update runs.

Important:
- `id` must be unique.
- Menu permission must match backend route permission.

---

## 5. Frontend Feature Extension Steps

1. Add model in `tms_ui/src/domain/models/mentorship.model.ts`
2. Add DTO in `tms_ui/src/domain/dto/mentorship.dto.ts`
3. Add service interface in `tms_ui/src/core/services/mentorship.service.interface.ts`
4. Add implementation in `tms_ui/src/core/services/impl/mentorship.service.ts`
5. Register service in `tms_ui/src/core/services/service.factory.ts`
6. Add API export in `tms_ui/src/core/api/services/mentorship.api.ts`
7. Add page in `tms_ui/src/features/mentorship/pages/MentorshipPage.tsx`
8. Add route in `tms_ui/src/app/router/index.tsx`
9. Wrap route with `PermissionGuard`

### Route pattern

```tsx
<PermissionGuard permissions={['mentorship.read']}>
  <MentorshipPage />
</PermissionGuard>
```

---

## 6. Validation Checklist

Backend:
- [ ] Endpoints visible in docs
- [ ] CRUD works
- [ ] Permission-protected endpoints return 403 when expected

Frontend:
- [ ] Page loads
- [ ] Queries/mutations work
- [ ] Unauthorized users cannot access route
- [ ] Menu visibility is role-aware

Build:

```bash
cd /Users/farhadrakib/Personal\ Projects/TMS/tms_ui
npm run build
```

---

## 7. Common Mistakes

1. Permission name mismatch between backend route, menu item, and frontend guard.
2. Router not registered in `tms_be/app/api/v1/__init__.py`.
3. Service not registered in `service.factory.ts`.
4. Missing backend restart after route/menu changes.
5. Using timezone-aware datetime with timestamp-without-timezone DB columns.

---

## 8. Recommended PR Content

For each feature PR, include:
- Backend files changed
- Frontend files changed
- New permissions
- Menu updates
- Migration revision
- Test commands and results

---

For a more detailed long-form extension reference, also see:
- `FEATURE_EXTENSION_DEVELOPER_GUIDE.md`
