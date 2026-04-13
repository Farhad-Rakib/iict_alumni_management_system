import {
  Sun,
  Moon,
  Rows3,
  Rows2,
  AlignJustify,
  PanelLeft,
  PanelLeftDashed,
  LayoutPanelLeft,
  SquareStack,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../../core/stores/theme.store';
import { usePreferencesStore } from '../../../core/stores/preferences.store';
import { siteSettingsApi } from '../../../core/api/services/site-settings.api';
import { toast } from '../../../components/ui/Toast/toast.store';

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
];

const densityOptions = [
  { value: 'compact' as const, label: 'Compact', icon: Rows3, desc: 'Smaller rows, more data visible' },
  { value: 'normal' as const, label: 'Normal', icon: Rows2, desc: 'Default spacing and sizing' },
  { value: 'comfortable' as const, label: 'Comfortable', icon: AlignJustify, desc: 'Larger rows, easier reading' },
];

const formOptions = [
  { value: 'modal' as const, label: 'Modal', icon: SquareStack, desc: 'Show RBAC forms in centered dialogs' },
  { value: 'drawer' as const, label: 'Drawer', icon: LayoutPanelLeft, desc: 'Open RBAC forms in side drawers' },
];

const menuOptions = [
  { value: 'fixed' as const, label: 'Fixed Sidebar', icon: PanelLeft, desc: 'Classic sidebar pinned to layout' },
  { value: 'floating' as const, label: 'Floating Sidebar', icon: PanelLeftDashed, desc: 'Card-like floating menu panel' },
];

const colorSchemes = [
  { value: 'buet' as const, label: 'BUET Green', swatch: 'bg-emerald-700' },
  { value: 'emerald' as const, label: 'Emerald Teal', swatch: 'bg-teal-700' },
  { value: 'slate' as const, label: 'Slate Ink', swatch: 'bg-slate-700' },
];

export const PreferencesPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    tableDensity,
    setTableDensity,
    sidebarCollapsed,
    formPresentation,
    setFormPresentation,
    menuStyle,
    setMenuStyle,
    colorScheme,
    setColorScheme,
    hydrateFromRemote,
  } = usePreferencesStore();

  useQuery({
    queryKey: ['site-settings', 'preferences'],
    queryFn: () => siteSettingsApi.getSetting('preferences'),
    onSuccess: (payload) => {
      hydrateFromRemote(payload.setting_value);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.updateSetting('preferences', {
        setting_value: {
          tableDensity,
          sidebarCollapsed,
          formPresentation,
          menuStyle,
          colorScheme,
        },
        description: 'UI and interaction preferences',
      }),
    onSuccess: () => toast.success('Preferences saved to database'),
    onError: () => toast.error('Failed to save preferences to database'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your experience</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred color theme</p>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  active
                    ? 'border-[#006A4E] bg-[#E8F4F0] dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#006A4E] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${active ? 'text-[#00553f] dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Color Scheme</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {colorSchemes.map((scheme) => {
              const active = colorScheme === scheme.value;
              return (
                <button
                  key={scheme.value}
                  onClick={() => setColorScheme(scheme.value)}
                  className={`flex items-center justify-between rounded-lg border-2 px-3 py-2.5 transition-all ${
                    active
                      ? 'border-[#006A4E] bg-[#E8F4F0] dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className={`text-sm font-medium ${active ? 'text-[#00553f] dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {scheme.label}
                  </span>
                  <span className={`h-4 w-4 rounded-full ${scheme.swatch}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Table Density</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Control how compact table rows appear</p>
        <div className="space-y-2">
          {densityOptions.map((opt) => {
            const Icon = opt.icon;
            const active = tableDensity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTableDensity(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  active
                    ? 'border-[#006A4E] bg-[#E8F4F0] dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#006A4E] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-[#00553f] dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Layout Behavior</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Control sidebar position and RBAC form presentation</p>

        <div className="space-y-2">
          {menuOptions.map((opt) => {
            const Icon = opt.icon;
            const active = menuStyle === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMenuStyle(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  active
                    ? 'border-[#006A4E] bg-[#E8F4F0] dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#006A4E] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-[#00553f] dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          {formOptions.map((opt) => {
            const Icon = opt.icon;
            const active = formPresentation === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFormPresentation(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  active
                    ? 'border-[#006A4E] bg-[#E8F4F0] dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#006A4E] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-[#00553f] dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Preview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">See how table density looks</p>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {['Alumni Officer', 'Event Coordinator', 'Alumni Member'].map((name) => (
                <tr key={name}>
                  <td className={`px-4 text-gray-900 dark:text-white ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>{name}</td>
                  <td className={`px-4 text-gray-600 dark:text-gray-400 ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>{name.split(' ')[1]}</td>
                  <td className={`px-4 ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Preferences Persistence</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Save your current preferences to the database</p>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[color:var(--brand-primary)] hover:opacity-90 text-white transition-colors disabled:opacity-60"
          >
            Save Preferences to DB
          </button>
        </div>
      </div>
    </div>
  );
};
