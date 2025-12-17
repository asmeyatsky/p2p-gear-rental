'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './auth/AuthProvider';
import { Container } from './ui/Layout';
import { CameraIcon } from '@heroicons/react/24/outline';

// Menu icons
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const navLinks = [
    { href: '/browse', label: 'Browse Gear' },
    { href: '/add-gear', label: 'List Your Gear' },
    { href: '/about', label: 'How It Works' },
    { href: '/contact', label: 'Contact' }
  ];

  const userLinks = user ? [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/my-rentals', label: 'My Rentals' },
    { href: '/profile', label: 'Profile' }
  ] : [];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <Container>
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
              <span>GearShare</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth/User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <UserIcon />
                  <span className="font-medium">{user.email?.split('@')[0] || 'User'}</span>
                  <ChevronDownIcon />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-4 py-2 text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="py-2 space-y-0.5">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded mx-1.5 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}

              {/* User Links */}
              {user && userLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded mx-1.5 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth Buttons */}
              <div className="pt-2 pb-1 border-t border-gray-200 mx-1.5">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-1.5 py-0.5 text-xs text-gray-500">
                      Signed in as {user.email}
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Click overlay to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
