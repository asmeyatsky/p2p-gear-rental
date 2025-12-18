import Link from 'next/link';
import { CameraIcon } from '@heroicons/react/24/outline';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header/Navigation */}
      <header className="relative z-10 px-4 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GearShare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Browse Gear
            </Link>
            <Link href="/add-gear" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              List Your Gear
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              How It Works
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium hidden sm:block">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-white text-gray-700 px-5 py-2.5 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <HeroSection />

      {/* Footer */}
      <footer className="relative z-10 px-4 py-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-600">© 2024 GearShare</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
