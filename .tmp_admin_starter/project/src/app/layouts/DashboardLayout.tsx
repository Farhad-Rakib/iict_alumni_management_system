import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from '../../components/CommandPalette/CommandPalette';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandPalette />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
