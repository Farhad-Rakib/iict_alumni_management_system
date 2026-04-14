"""RBAC helpers for role-to-permission mapping."""


ACTION_ALIASES: dict[str, str] = {
    "add": "create",
    "create": "create",
    "view": "read",
    "read": "read",
    "edit": "update",
    "update": "update",
    "delete": "delete",
}


def normalize_permission_name(permission: str) -> str:
    """Normalize permission naming to resource.crud_action format when applicable."""
    if permission == "*" or "." not in permission:
        return permission
    parts = permission.split(".")
    if len(parts) < 2:
        return permission
    if len(parts) == 2:
        resource, action = parts
        mapped_action = ACTION_ALIASES.get(action, action)
        return f"{resource}.{mapped_action}"

    # For nested permissions (e.g., rbac.permissions.view), normalize only the last segment.
    prefix = ".".join(parts[:-1])
    last = parts[-1]
    mapped_last = ACTION_ALIASES.get(last, last)
    return f"{prefix}.{mapped_last}"

def has_permissions(user_permissions: set[str], required_permissions: tuple[str, ...], require_all: bool) -> bool:
    """Check if permissions satisfy the required list."""
    normalized_user_permissions = {normalize_permission_name(p) for p in user_permissions}
    normalized_required = tuple(normalize_permission_name(p) for p in required_permissions)

    if "*" in user_permissions or "*" in normalized_user_permissions:
        return True
    if not normalized_required:
        return True
    if require_all:
        return all(permission in user_permissions or permission in normalized_user_permissions for permission in normalized_required)
    return any(permission in user_permissions or permission in normalized_user_permissions for permission in normalized_required)