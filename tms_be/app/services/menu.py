"""Service layer for permission-aware menu generation."""
from app.core.rbac import has_permissions
from app.models.user import User
from app.schemas.menu import MenuItemResponse
from app.services.rbac import RBACService


MENU_ITEMS: list[dict] = [
    {
        "id": "dashboard",
        "label": "Dashboard",
        "path": "/dashboard",
        "icon": "LayoutDashboard",
        "permissions": ["dashboard.view"],
    },
    {
        "id": "users",
        "label": "Alumni Directory",
        "icon": "Users",
        "permissions": ["users.view"],
        "children": [
            {
                "id": "users-list",
                "label": "All Alumni",
                "path": "/users",
                "permissions": ["users.view"],
            }
        ],
    },
    {
        "id": "activity",
        "label": "Activity Log",
        "path": "/activity",
        "icon": "Activity",
        "permissions": ["activity.view"],
    },
    {
        "id": "reports",
        "label": "Reports",
        "path": "/reports",
        "icon": "FileText",
        "permissions": ["reports.view"],
        "badge": "New",
        "badgeVariant": "success",
    },
    {
        "id": "settings",
        "label": "Settings",
        "icon": "Settings",
        "permissions": ["settings.view"],
        "children": [
            {
                "id": "settings-general",
                "label": "General",
                "path": "/settings/general",
                "permissions": ["settings.view"],
            },
            {
                "id": "settings-security",
                "label": "Security",
                "path": "/settings/security",
                "permissions": ["settings.view"],
            },
            {
                "id": "settings-rbac",
                "label": "RBAC",
                "permissions": [
                    "rbac.manage",
                    "rbac.permissions.view",
                    "rbac.roles.view",
                    "rbac.users.view",
                    "rbac.role_permissions.view",
                    "rbac.user_roles.view",
                    "rbac.user_permissions.view",
                ],
                "children": [
                    {
                        "id": "settings-rbac-overview",
                        "label": "Overview",
                        "path": "/settings/rbac",
                        "permissions": [
                            "rbac.manage",
                            "rbac.permissions.view",
                            "rbac.roles.view",
                            "rbac.users.view",
                            "rbac.role_permissions.view",
                            "rbac.user_roles.view",
                            "rbac.user_permissions.view",
                        ],
                    },
                    {
                        "id": "settings-rbac-roles",
                        "label": "Role",
                        "path": "/settings/rbac?section=roles",
                        "permissions": ["rbac.manage", "rbac.roles.view"],
                    },
                    {
                        "id": "settings-rbac-users",
                        "label": "User",
                        "path": "/settings/rbac?section=users",
                        "permissions": ["rbac.manage", "rbac.users.view"],
                    },
                    {
                        "id": "settings-rbac-permissions",
                        "label": "Permissions",
                        "path": "/settings/rbac?section=permissions",
                        "permissions": ["rbac.manage", "rbac.permissions.view"],
                    },
                    {
                        "id": "settings-rbac-role-permissions",
                        "label": "Role Permission",
                        "path": "/settings/rbac?section=role-permissions",
                        "permissions": ["rbac.manage", "rbac.role_permissions.view"],
                    },
                    {
                        "id": "settings-rbac-user-roles",
                        "label": "User Role Assignment",
                        "path": "/settings/rbac?section=user-roles",
                        "permissions": ["rbac.manage", "rbac.user_roles.view"],
                    },
                    {
                        "id": "settings-rbac-user-permissions",
                        "label": "User Permission Assignment",
                        "path": "/settings/rbac?section=user-permissions",
                        "permissions": ["rbac.manage", "rbac.user_permissions.view"],
                    },
                ],
            },
            {
                "id": "settings-notifications",
                "label": "Notifications",
                "path": "/settings/notifications",
                "permissions": ["settings.view"],
            },
        ],
    },
    {
        "id": "preferences",
        "label": "Preferences",
        "path": "/preferences",
        "icon": "Sliders",
        "permissions": ["dashboard.view"],
    },
]


class MenuService:
    """Build menu tree filtered by effective permissions."""

    def __init__(self, session):
        self.rbac_service = RBACService(session)

    async def get_menu_for_user(self, user: User) -> list[MenuItemResponse]:
        user_permissions = await self.rbac_service.get_effective_permissions(user)
        filtered = self._filter_items(MENU_ITEMS, user_permissions)
        return [MenuItemResponse.model_validate(item) for item in filtered]

    def _filter_items(self, items: list[dict], user_permissions: set[str]) -> list[dict]:
        visible: list[dict] = []
        for item in items:
            required = tuple(item.get("permissions", []))
            if required and not has_permissions(user_permissions, required, require_all=False):
                continue

            mapped = {**item}
            children = item.get("children")
            if children:
                filtered_children = self._filter_items(children, user_permissions)
                if not filtered_children:
                    continue
                mapped["children"] = filtered_children
            visible.append(mapped)
        return visible
