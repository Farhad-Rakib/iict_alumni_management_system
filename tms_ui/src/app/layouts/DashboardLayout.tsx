import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from '../../components/CommandPalette/CommandPalette';
import { siteSettingsApi } from '../../core/api/services/site-settings.api';
import { useSettingsStore } from '../../features/settings/store/settings.store';
import { usePreferencesStore } from '../../core/stores/preferences.store';
import { AppConfig } from '../../core/config/app.config';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hydrateSection, general } = useSettingsStore();
  const { hydrateFromRemote } = usePreferencesStore();
  const canReadSiteSettings = useAuthStore((state) =>
    state.hasAnyPermission(['settings.read', 'settings.view', 'site-settings.read', 'site-settings.view'])
  );

  useQuery({
    queryKey: ['site-settings', 'general'],
    queryFn: () => siteSettingsApi.getSetting('general'),
    enabled: canReadSiteSettings,
    onSuccess: (payload) => {
      hydrateSection('general', payload.setting_value, payload.updated_at);
    },
  });

  useQuery({
    queryKey: ['site-settings', 'preferences'],
    queryFn: () => siteSettingsApi.getSetting('preferences'),
    enabled: canReadSiteSettings,
    onSuccess: (payload) => {
      hydrateFromRemote(payload.setting_value);
    },
  });

  useEffect(() => {
    document.title = general.siteName || AppConfig.app.name;
  }, [general.siteName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-surface)] via-white to-[#fff6f6] dark:from-gray-950 dark:to-gray-950">
      <CommandPalette />
      <div className="flex h-screen overflow-hidden px-0 lg:px-2 lg:py-2">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-gray-200/70 lg:bg-white/70 lg:backdrop-blur-sm dark:lg:border-gray-800 dark:lg:bg-gray-950/70">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
