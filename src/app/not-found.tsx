import Link from 'next/link';
import { HomeIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 9.172 4 4 0 00-5.656 0m1.172-8-8a4 4 0 11.314 0l8.485 8.485a2.528 2.528 0 003.353-3.353L13 12l4.172 4.172z"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, 
          deleted, or you might have mistyped the URL.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Here are some helpful links:</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/browse"
              className="flex items-center p-3 text-blue-700 bg-white rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Browse Gear</span>
            </Link>
            
            <Link
              href="/add-gear"
              className="flex items-center p-3 text-blue-700 bg-white rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">List Your Gear</span>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>Try these suggestions:</strong>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 mt-2 text-left max-w-md mx-auto">
            <li>• Check the spelling of the URL</li>
            <li>• Try using our search to find what you're looking for</li>
            <li>• Navigate back to our homepage</li>
            <li>• Contact support if you believe this is an error</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          If you continue to experience issues, please contact our 
          <a href="mailto:support@gearshare.com" className="text-blue-600 hover:text-blue-700 underline">
            support team
          </a>
        </div>
      </div>
    </div>
  );
}