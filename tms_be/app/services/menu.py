"""Service layer for permission-aware menu generation."""
from sqlalchemy import update

from app.core.rbac import has_permissions
from app.models.menu import MenuItem
from app.models.user import User
from app.repositories.menu import MenuRepository
from app.schemas.menu import MenuItemResponse
from app.services.rbac import RBACService


DEFAULT_MENU_ITEMS: list[dict] = [
    {
        "id": "dashboard",
        "label": "Dashboard",
        "path": "/dashboard",
        "icon": "LayoutDashboard",
        "permissions": ["dashboard.read"],
    },
    {
        "id": "activity",
        "label": "Activity Log",
        "path": "/activity",
        "icon": "Activity",
        "permissions": ["activity.read"],
    },
    {
        "id": "jobs",
        "label": "Jobs",
        "path": "/jobs",
        "icon": "Briefcase",
        "permissions": ["jobs.read"],
    },
    {
        "id": "events",
        "label": "Events",
        "path": "/events",
        "icon": "CalendarDays",
        "permissions": ["events.read"],
    },
    {
        "id": "elections",
        "label": "Elections",
        "path": "/elections",
        "icon": "Vote",
        "permissions": ["elections.view"],
    },
    {
        "id": "alumni",
        "label": "Alumni",
        "path": "/alumni",
        "icon": "GraduationCap",
        "permissions": ["alumni.read"],
    },
    {
        "id": "reports",
        "label": "Reports",
        "path": "/reports",
        "icon": "FileText",
        "permissions": ["reports.read"],
        "badge": "New",
        "badgeVariant": "success",
    },
    {
        "id": "settings",
        "label": "Settings",
        "icon": "Settings",
        "children": [
            {
                "id": "settings-preferences",
                "label": "Preferences",
                "path": "/preferences",
                "permissions": ["dashboard.read"],
            },
            {
                "id": "settings-general",
                "label": "General",
                "path": "/settings/general",
                "permissions": ["settings.read"],
            },
            {
                "id": "settings-security",
                "label": "Security",
                "path": "/settings/security",
                "permissions": ["settings.read"],
            },
            {
                "id": "settings-rbac",
                "label": "RBAC",
                "children": [
                    {
                        "id": "settings-rbac-users",
                        "label": "Users",
                        "path": "/settings/rbac?section=users",
                        "permissions": [
                            "users.read",
                            "users.create",
                            "users.update",
                            "users.delete",
                        ],
                    },
                    {
                        "id": "settings-rbac-roles",
                        "label": "Roles",
                        "path": "/settings/rbac?section=roles",
                        "permissions": ["rbac.manage", "rbac.roles.read"],
                    },
                    {
                        "id": "settings-rbac-permissions",
                        "label": "Permissions",
                        "path": "/settings/rbac?section=permissions",
                        "permissions": ["rbac.manage", "rbac.permissions.read"],
                    },
                    {
                        "id": "settings-rbac-role-permissions",
                        "label": "Role Permissions",
                        "path": "/settings/rbac?section=role-permissions",
                        "permissions": ["rbac.manage", "rbac.role_permissions.read"],
                    },
                    {
                        "id": "settings-rbac-user-roles",
                        "label": "User Role Permissions",
                        "path": "/settings/rbac?section=user-roles",
                        "permissions": ["rbac.manage", "rbac.user_roles.read"],
                    },
                    {
                        "id": "settings-rbac-user-permissions",
                        "label": "User Permissions",
                        "path": "/settings/rbac?section=user-permissions",
                        "permissions": ["rbac.manage", "rbac.user_permissions.read"],
                    },
                    {
                        "id": "settings-rbac-overview",
                        "label": "RBAC Overview",
                        "path": "/settings/rbac",
                        "permissions": [
                            "rbac.manage",
                            "rbac.permissions.read",
                            "rbac.roles.read",
                            "rbac.users.read",
                            "rbac.role_permissions.read",
                            "rbac.user_roles.read",
                            "rbac.user_permissions.read",
                        ],
                    },
                ],
            },
            {
                "id": "settings-notifications",
                "label": "Notifications",
                "path": "/settings/notifications",
                "permissions": ["settings.read"],
            },
            {
                "id": "settings-cms",
                "label": "CMS",
                "permissions": ["cms.manage"],
                "children": [
                    {
                        "id": "settings-cms-pages",
                        "label": "Pages",
                        "path": "/settings/cms?section=pages",
                        "permissions": ["cms.manage"],
                    },
                    {
                        "id": "settings-cms-sliders",
                        "label": "Sliders",
                        "path": "/settings/cms?section=sliders",
                        "permissions": ["cms.manage"],
                    },
                    {
                        "id": "settings-cms-committee",
                        "label": "Committee",
                        "path": "/settings/cms?section=committee",
                        "permissions": ["cms.manage"],
                    },
                    {
                        "id": "settings-cms-gallery",
                        "label": "Gallery",
                        "path": "/settings/cms?section=gallery",
                        "permissions": ["cms.manage"],
                    },
                    {
                        "id": "settings-cms-contact",
                        "label": "Contact",
                        "path": "/settings/cms?section=contact",
                        "permissions": ["cms.manage"],
                    },
                ],
            },
        ],
    },
]


class MenuService:
    """Build menu tree filtered by effective permissions."""

    def __init__(self, session):
        self.repo = MenuRepository(session)
        self.session = session
        self.rbac_service = RBACService(session)

    async def ensure_seeded(self) -> None:
        await self._ensure_seeded()

    async def get_menu_for_user(self, user: User) -> list[MenuItemResponse]:
        await self._ensure_seeded()
        user_permissions = await self.rbac_service.get_effective_permissions(user)
        items = await self.repo.list_active()
        menu_tree = self._build_tree(items)
        filtered = self._filter_items(menu_tree, user_permissions)
        return [MenuItemResponse.model_validate(item) for item in filtered]

    async def _ensure_seeded(self) -> None:
        key_map = await self.repo.list_key_map()

        # Keep Alumni as a top-level module and hide the legacy Settings > Alumni entry.
        if "settings-alumni" in key_map:
            await self.session.execute(
                update(MenuItem)
                .where(MenuItem.key == "settings-alumni")
                .values(is_active=False)
            )

        async def add_nodes(nodes: list[dict], parent_id: int | None = None, sort_base: int = 0) -> None:
            for idx, node in enumerate(nodes):
                key = node["id"]
                existing_id = key_map.get(key)
                if existing_id is None:
                    row = MenuItem(
                        key=key,
                        label=node["label"],
                        path=node.get("path"),
                        icon=node.get("icon"),
                        parent_id=parent_id,
                        required_permissions=node.get("permissions"),
                        sort_order=sort_base + idx,
                        is_active=True,
                        badge=node.get("badge"),
                        badge_variant=node.get("badgeVariant"),
                    )
                    self.session.add(row)
                    await self.session.flush()
                    existing_id = row.id
                    key_map[key] = existing_id

                children = node.get("children") or []
                if children:
                    await add_nodes(children, parent_id=existing_id, sort_base=0)

        await add_nodes(DEFAULT_MENU_ITEMS)
        await self.repo.commit()

    def _build_tree(self, rows: list[MenuItem]) -> list[dict]:
        by_parent: dict[int | None, list[MenuItem]] = {}
        for row in rows:
            by_parent.setdefault(row.parent_id, []).append(row)

        for key in by_parent:
            by_parent[key].sort(key=lambda item: (item.sort_order, item.id))

        def to_dict(item: MenuItem) -> dict:
            children = [to_dict(child) for child in by_parent.get(item.id, [])]
            payload = {
                "id": item.key,
                "label": item.label,
                "path": item.path,
                "icon": item.icon,
                "permissions": item.required_permissions,
                "badge": item.badge,
                "badgeVariant": item.badge_variant,
            }
            if children:
                payload["children"] = children
            return payload

        return [to_dict(root) for root in by_parent.get(None, [])]

    def _filter_items(self, items: list[dict], user_permissions: set[str]) -> list[dict]:
        visible: list[dict] = []
        for item in items:
            required = tuple(item.get("permissions") or [])
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
