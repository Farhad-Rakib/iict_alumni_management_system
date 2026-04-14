export interface MenuItem {
  id: string;
  label: string;
  path?: string | null;
  icon?: string | null;
  children?: MenuItem[] | null;
  permissions?: string[] | null;
  badge?: string | null;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error' | null;
}

export type MenuItems = MenuItem[];
