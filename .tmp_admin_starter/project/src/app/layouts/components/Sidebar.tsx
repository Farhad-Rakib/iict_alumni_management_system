import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, X, Command } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../../core/api/services/menu.api';
import { MenuItem } from '../../../domain/models/menu.model';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { AppConfig } from '../../../core/config/app.config';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { hasAnyPermission } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuApi.getMenuItems(),
  });

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const hasPermissionForItem = (item: MenuItem): boolean => {
    if (!item.permissions || item.permissions.length === 0) return true;
    return hasAnyPermission(item.permissions);
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(hasPermissionForItem)
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }))
      .filter((item) => !item.children || item.children.length > 0);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    if (!hasPermissionForItem(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path === location.pathname;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isExpanded
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${1 + depth * 0.75}rem` }}
          >
            <div className="flex items-center gap-3">
              {getIcon(item.icon)}
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {item.badge}
                </span>
              )}
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.filter(hasPermissionForItem).map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path || '#'}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${1 + depth * 0.75}rem` }}
      >
        {getIcon(item.icon)}
        <span>{item.label}</span>
        {item.badge && (
          <span
            className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
              isActive ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Command className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {AppConfig.app.name}
            </h2>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-medium">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-medium">K</kbd>
            <span className="ml-1">Quick Search</span>
          </div>
        </div>
      </aside>
    </>
  );
};
