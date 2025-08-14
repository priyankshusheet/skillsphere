import React from 'react';
import Card from '../../components/UI/Card';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View detailed analytics and generate reports on skills development.
        </p>
      </div>

      <Card>
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This page will contain charts, reports, and insights about skills development across the organization.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
