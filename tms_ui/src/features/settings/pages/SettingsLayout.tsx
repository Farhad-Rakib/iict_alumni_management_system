import { GeneralSettingsPage } from './GeneralSettingsPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';
import { NotificationSettingsPage } from './NotificationSettingsPage';

export const SettingsLayout: React.FC<{ initialTab?: string }> = ({ initialTab = 'general' }) => {
  if (initialTab === 'security') return <SecuritySettingsPage />;
  if (initialTab === 'notifications') return <NotificationSettingsPage />;
  return <GeneralSettingsPage />;
};
