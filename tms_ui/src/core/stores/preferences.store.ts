import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TableDensity = 'compact' | 'normal' | 'comfortable';
type FormPresentation = 'modal' | 'drawer';
type MenuStyle = 'fixed' | 'floating';
type ColorScheme = 'buet' | 'emerald' | 'slate';

const applyColorScheme = (scheme: ColorScheme) => {
  const root = document.documentElement;
  if (scheme === 'emerald') {
    root.style.setProperty('--brand-primary', '#047857');
    root.style.setProperty('--brand-accent', '#0f766e');
    root.style.setProperty('--brand-surface', '#f0fdf4');
    return;
  }
  if (scheme === 'slate') {
    root.style.setProperty('--brand-primary', '#334155');
    root.style.setProperty('--brand-accent', '#0f172a');
    root.style.setProperty('--brand-surface', '#f8fafc');
    return;
  }
  root.style.setProperty('--brand-primary', '#006A4E');
  root.style.setProperty('--brand-accent', '#C1272D');
  root.style.setProperty('--brand-surface', '#f3faf7');
};

interface PreferencesState {
  tableDensity: TableDensity;
  sidebarCollapsed: boolean;
  formPresentation: FormPresentation;
  menuStyle: MenuStyle;
  colorScheme: ColorScheme;
  setTableDensity: (d: TableDensity) => void;
  setSidebarCollapsed: (c: boolean) => void;
  setFormPresentation: (v: FormPresentation) => void;
  setMenuStyle: (v: MenuStyle) => void;
  setColorScheme: (v: ColorScheme) => void;
  hydrateFromRemote: (payload: Partial<{
    tableDensity: TableDensity;
    sidebarCollapsed: boolean;
    formPresentation: FormPresentation;
    menuStyle: MenuStyle;
    colorScheme: ColorScheme;
  }>) => void;
  exportAsJSON: () => string;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      tableDensity: 'normal',
      sidebarCollapsed: false,
      formPresentation: 'modal',
      menuStyle: 'fixed',
      colorScheme: 'buet',
      setTableDensity: (tableDensity) => set({ tableDensity }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setFormPresentation: (formPresentation) => set({ formPresentation }),
      setMenuStyle: (menuStyle) => set({ menuStyle }),
      setColorScheme: (colorScheme) => {
        applyColorScheme(colorScheme);
        set({ colorScheme });
      },
      hydrateFromRemote: (payload) => {
        const nextColorScheme = payload.colorScheme;
        if (nextColorScheme) applyColorScheme(nextColorScheme);
        set((state) => ({
          tableDensity: payload.tableDensity ?? state.tableDensity,
          sidebarCollapsed: payload.sidebarCollapsed ?? state.sidebarCollapsed,
          formPresentation: payload.formPresentation ?? state.formPresentation,
          menuStyle: payload.menuStyle ?? state.menuStyle,
          colorScheme: payload.colorScheme ?? state.colorScheme,
        }));
      },
      exportAsJSON: () => {
        const state = get();
        return JSON.stringify(
          {
            tableDensity: state.tableDensity,
            sidebarCollapsed: state.sidebarCollapsed,
            formPresentation: state.formPresentation,
            menuStyle: state.menuStyle,
            colorScheme: state.colorScheme,
          },
          null,
          2
        );
      },
    }),
    {
      name: 'alumni_preferences',
      onRehydrateStorage: () => (state) => {
        if (state) applyColorScheme(state.colorScheme);
      },
    }
  )
);
