'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500 mb-4">
            <ExclamationTriangleIcon className="h-full w-full" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-lg text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred while processing your request.'}
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">What you can try:</h2>
            <ul className="text-left text-blue-800 space-y-2">
              <li>Refresh the page and try again</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cache and cookies</li>
              <li>If the problem persists, contact our support team</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
