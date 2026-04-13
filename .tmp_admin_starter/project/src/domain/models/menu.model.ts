export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  permissions?: string[];
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error';
}

export type MenuItems = MenuItem[];
