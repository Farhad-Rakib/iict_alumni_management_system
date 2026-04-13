# Developer RBAC Guide

This guide explains how to add a new module with permissions, assign roles/users, secure endpoints, and verify menu visibility.

## 1. RBAC Components

- Permission: action scope string (for example `library.create`)
- Role: named group of permissions
- User role mapping: user gets permissions via one or more roles
- User permission mapping: user gets direct permissions on top of role permissions
- Effective permissions: base role + dynamic role permissions + direct user permissions

## 2. Permission Naming Convention

Use `module.action` format.

Common actions:
- `view`
- `create`
- `edit`
- `delete`
- `manage`

Example for `library` module:
- `library.view`
- `library.create`
- `library.edit`
- `library.delete`

## 3. Create New Permissions

Option A: RBAC UI
- Go to Settings -> RBAC -> Permissions
- Add new permission rows

Option B: API
- Endpoint: `POST /api/v1/rbac/permissions`
- Body example:
```json
{
  "name": "library.create",
  "description": "Create library records",
  "resource": "library",
  "action": "create"
}
```

## 4. Map Permissions to Roles

- Endpoint: `PUT /api/v1/rbac/roles/{role_id}/permissions`
- Body:
```json
{
  "permission_ids": [1, 2, 3]
}
```

You can also assign direct permissions to specific users:
- `PUT /api/v1/rbac/users/{user_id}/permissions`

## 5. Secure Backend Endpoints

For every protected route, add permission dependency:

```python
from fastapi import Depends
from app.dependencies.auth import require_permission

@router.post("/", dependencies=[Depends(require_permission("library.create"))])
async def create_library_item(...):
    ...
```

Tips:
- Use `dependencies=[Depends(require_permission("x.y"))]` for route-wide checks.
- Use parameter style `current_user = Depends(require_permission("x.y"))` if handler needs user object.

## 6. Add Default Permissions for Fresh Environments

For system defaults, update both:
- `tms_be/app/core/rbac.py`: static role permission map
- `tms_be/app/services/rbac.py`: `DEFAULT_PERMISSION_META`

This ensures new databases auto-seed these permissions.

## 7. How Menu and RBAC Work Jointly

Menu visibility is permission-driven end-to-end.

Flow:
1. User logs in and gets authenticated.
2. Backend computes effective permissions using:
   - base role permissions
   - dynamic role-permission mappings
   - direct user-permission mappings
3. Frontend requests `GET /api/v1/menu`.
4. Backend filters menu tree using those effective permissions.
5. Frontend renders only returned items.

Important behavior:
- Missing permission means menu item is hidden.
- Hidden menu does not replace backend protection.
- Endpoint must still use `require_permission(...)`.

Where to look:
- Menu route: `tms_be/app/api/v1/routes/menu.py`
- Menu filter logic: `tms_be/app/services/menu.py`
- Effective permission computation: `tms_be/app/services/rbac.py`
- Endpoint permission dependency: `tms_be/app/dependencies/auth.py`

## 8. Add a Menu Item for a New Module

1. Add permission names for module (for example `library.view`, `library.create`).
2. Add route guards with `require_permission(...)` on backend endpoints.
3. Add menu node in backend menu definition (`MENU_ITEMS` in `app/services/menu.py`) with `permissions` field.
4. Map permissions to role/user through RBAC.
5. Verify item appears only for allowed users.

Example menu node:
```python
{
  "id": "library",
  "label": "Library",
  "path": "/library",
  "icon": "BookOpen",
  "permissions": ["library.view"]
}
```

## 9. Site Settings Storage

Global settings are stored in table:
- `site_settings`

Used keys:
- `general`
- `preferences`
- `security`
- `notifications`

API:
- `GET /api/v1/site-settings/{setting_key}`
- `PUT /api/v1/site-settings/{setting_key}`

## 10. Quick Verification Checklist

1. Create permission (`library.create`).
2. Assign to a role (or direct user permission).
3. Protect endpoint with `require_permission("library.create")`.
4. Login as allowed user -> endpoint returns success.
5. Login as non-allowed user -> endpoint returns `403`.
6. Confirm menu visibility matches user permissions.
7. Confirm blocked endpoint still returns `403` even if user tries direct URL/API call.

## 11. Common Pitfalls

- Creating permission but not assigning it to a role/user.
- Protecting frontend route only, but forgetting backend endpoint guard.
- Inconsistent permission naming (for example `library.add` vs `library.create`).
- Not updating defaults for fresh deployments.
- Showing a menu item without matching endpoint permission guard.
