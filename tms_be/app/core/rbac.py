"""RBAC helpers for role-to-permission mapping."""
from app.models.user import RoleEnum


ROLE_PERMISSIONS: dict[RoleEnum, set[str]] = {
    RoleEnum.SUPER_ADMIN: {"*"},
    RoleEnum.ADMIN: {
        "dashboard.view",
        "reports.view",
        "activity.view",
        "settings.view",
        "rbac.manage",
        "rbac.permissions.view",
        "rbac.roles.view",
        "rbac.users.view",
        "rbac.role_permissions.view",
        "rbac.user_roles.view",
        "rbac.user_permissions.view",
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "alumni.view",
        "alumni.create",
        "alumni.edit",
        "alumni.delete",
        "events.view",
        "events.create",
        "events.edit",
        "events.delete",
        "events.rsvp",
        "events.view_rsvps",
        "jobs.view",
        "jobs.create",
        "jobs.edit",
        "jobs.delete",
        "jobs.apply",
        "jobs.view_applications",
        "notices.view",
        "notices.manage_categories",
        "notices.create",
        "notices.edit",
        "notices.delete",
        "elections.view",
        "elections.manage",
        "elections.vote",
        "elections.results",
        "cms.view",
        "cms.manage",
        "alumni.profile.edit",
    },
    RoleEnum.EVENT_MANAGER: {
        "dashboard.view",
        "reports.view",
        "events.view",
        "events.create",
        "events.edit",
        "events.rsvp",
        "events.view_rsvps",
        "jobs.view",
        "notices.view",
        "alumni.view",
    },
    RoleEnum.ELECTION_MANAGER: {
        "dashboard.view",
        "reports.view",
        "elections.view",
        "elections.manage",
        "elections.vote",
        "elections.results",
        "notices.view",
        "alumni.view",
    },
    RoleEnum.ALUMNI: {
        "dashboard.view",
        "reports.view",
        "alumni.view",
        "alumni.profile.edit",
        "events.view",
        "events.rsvp",
        "jobs.view",
        "jobs.apply",
        "notices.view",
        "elections.view",
        "elections.vote",
        "elections.results",
        "cms.view",
    },
}


def get_permissions_for_role(role: RoleEnum) -> set[str]:
    """Return permissions associated with the user role."""
    return ROLE_PERMISSIONS.get(role, set())


def has_permissions(user_permissions: set[str], required_permissions: tuple[str, ...], require_all: bool) -> bool:
    """Check if permissions satisfy the required list."""
    if "*" in user_permissions:
        return True
    if not required_permissions:
        return True
    if require_all:
        return all(permission in user_permissions for permission in required_permissions)
    return any(permission in user_permissions for permission in required_permissions)