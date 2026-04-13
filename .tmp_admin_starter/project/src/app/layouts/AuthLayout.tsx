import { Outlet } from 'react-router-dom';
import { AppConfig } from '../../core/config/app.config';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {AppConfig.app.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{AppConfig.app.description}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <Outlet />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Version {AppConfig.app.version}
          </p>
        </div>
      </div>
    </div>
  );
};
