import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-gray-400">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for. Please check the URL and try again.
        </p>
        <div className="space-y-4">
          <Link to="/">
            <Button fullWidth>
              Go back home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" fullWidth>
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
