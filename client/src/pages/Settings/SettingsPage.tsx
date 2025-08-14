import React from 'react';
import Card from '../../components/UI/Card';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure application settings and preferences.
        </p>
      </div>

      <Card>
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Settings Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This page will contain application settings, notifications, and system preferences.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
