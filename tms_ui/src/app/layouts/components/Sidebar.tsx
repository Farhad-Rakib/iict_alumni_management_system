import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, X, Command } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../../core/api/services/menu.api';
import { MenuItem } from '../../../domain/models/menu.model';
import { AppConfig } from '../../../core/config/app.config';
import { usePreferencesStore } from '../../../core/stores/preferences.store';
import { useSettingsStore } from '../../../features/settings/store/settings.store';
import { useAuthStore } from '../../../features/auth/store/auth.store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { menuStyle } = usePreferencesStore();
  const { general } = useSettingsStore();
  const userId = useAuthStore((state) => state.user?.id);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu', userId],
    queryFn: () => menuApi.getMenuItems(),
    enabled: Boolean(userId),
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

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const currentPath = `${location.pathname}${location.search}`;
    const isActive = (() => {
      if (!item.path) return false;
      const hasQuery = item.path.includes('?');
      if (hasQuery) return item.path === currentPath;
      return item.path === location.pathname && location.search.length === 0;
    })();

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isExpanded
                ? 'bg-[color:var(--brand-surface)] dark:bg-emerald-900/20 text-[color:var(--brand-primary)] dark:text-emerald-300'
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
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
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
            ? 'bg-[color:var(--brand-primary)] text-white shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${1 + depth * 0.75}rem` }}
      >
        {getIcon(item.icon)}
        <span>{item.label}</span>
        {item.badge && (
          <span
            className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
              isActive ? 'bg-black/20 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[86vw] max-w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${menuStyle === 'floating' ? 'lg:mx-2 lg:my-2 lg:rounded-2xl lg:shadow-xl lg:h-[calc(100vh-1rem)]' : ''} flex flex-col`}
      >
        <div className={`flex items-center justify-between px-4 py-4 border-b ${menuStyle === 'floating' ? 'border-gray-100 dark:border-gray-800/70' : 'border-gray-200 dark:border-gray-800'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[color:var(--brand-primary)] rounded-lg flex items-center justify-center shrink-0">
              <Command className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {general.siteName || AppConfig.app.name}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">Admin Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {menuItems.map((item) => renderMenuItem(item))}
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
