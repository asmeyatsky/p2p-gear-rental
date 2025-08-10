'use client';

import Link from 'next/link';
import { useAuth } from './auth/AuthProvider';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          GearShare
        </Link>
        <nav className="hidden md:flex space-x-6 items-center">
          <Link href="/about" className="text-gray-600 hover:text-gray-900">
            About
          </Link>
          <Link href="/browse" className="text-gray-600 hover:text-gray-900">
            Browse Gear
          </Link>
          <Link href="/faq" className="text-gray-600 hover:text-gray-900">
            FAQ
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900">
            Contact
          </Link>
          {user && (
            <>
              <Link href="/add-gear" className="text-gray-600 hover:text-gray-900">
                Add Gear
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                Profile
              </Link>
              <Link href="/my-rentals" className="text-gray-600 hover:text-gray-900">
                My Rentals
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {user ? (
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900"
            >
              Log Out
            </button>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
