'use client';
import Link from 'next/link';
import Header from '@/components/Header';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      <Header />
      <div className="relative z-10 px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Join GearShare</h2>
              <p className="mt-2 text-gray-600">
                Choose how you want to get started.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I want to rent gear</h3>
                <p className="text-gray-600 mb-6">
                  Browse thousands of items from our community of creators.
                </p>
                <Link href="/auth/signup/renter">
                  <span className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-6 py-3 text-lg">
                    Sign up as a Renter
                  </span>
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I want to list my gear</h3>
                <p className="text-gray-600 mb-6">
                  Earn money by renting out your gear to our community.
                </p>
                <Link href="/auth/signup/lister">
                  <span className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 px-6 py-3 text-lg">
                    Sign up as a Lister
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
