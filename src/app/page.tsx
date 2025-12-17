'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CameraIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const categories = [
  { name: 'Cameras', icon: '📷', href: '/browse?category=cameras', color: 'from-blue-500 to-indigo-600' },
  { name: 'Lenses', icon: '🔍', href: '/browse?category=lenses', color: 'from-purple-500 to-pink-600' },
  { name: 'Lighting', icon: '💡', href: '/browse?category=lighting', color: 'from-yellow-500 to-orange-600' },
  { name: 'Drones', icon: '🚁', href: '/browse?category=drones', color: 'from-cyan-500 to-blue-600' },
  { name: 'Audio', icon: '🎙️', href: '/browse?category=audio', color: 'from-green-500 to-emerald-600' },
  { name: 'Tripods', icon: '📐', href: '/browse?category=tripods', color: 'from-gray-500 to-slate-600' },
];

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
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0"
      >
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
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 border border-gray-200 shadow-sm"
            >
              <SparklesIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-700 font-medium">The #1 Gear Rental Platform</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Rent Pro Gear
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create Amazing
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-6">
              Access professional cameras, lenses, and equipment from local owners.
              Save money, reduce waste, and create stunning content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/browse"
                  className="group flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <CameraIcon className="w-5 h-5" />
                  Browse Gear
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/add-gear"
                  className="group flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <CurrencyDollarIcon className="w-5 h-5" />
                  List Your Gear
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
          >
            {[
              { value: '10K+', label: 'Gear Items', icon: CameraIcon },
              { value: '5K+', label: 'Happy Renters', icon: StarIcon },
              { value: '2K+', label: 'Owners Earning', icon: CurrencyDollarIcon },
              { value: '100+', label: 'Cities', icon: MapPinIcon },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <stat.icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Browse by Category
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <Link
                    href={cat.href}
                    className="block bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-center group"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <div className="text-sm text-gray-700 font-medium">{cat.name}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-4 py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-bold text-gray-900 mb-8"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* For Renters */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">For Renters</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Browse thousands of items near you',
                  'Book instantly with secure payments',
                  'Pick up gear and start creating',
                  'Return and leave a review'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} className="mt-6">
                <Link
                  href="/browse"
                  className="block text-center bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Start Browsing
                </Link>
              </motion.div>
            </motion.div>

            {/* For Owners */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">For Owners</h3>
              </div>
              <div className="space-y-4">
                {[
                  'List your gear in minutes',
                  'Set your own prices and availability',
                  'Approve rental requests',
                  'Earn money from your equipment'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-green-600">{i + 1}</span>
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} className="mt-6">
                <Link
                  href="/add-gear"
                  className="block text-center bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                  List Your Gear
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
          >
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">
              Why Choose GearShare?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: 'Fully Insured',
                  desc: 'Every rental is protected with comprehensive coverage',
                  color: 'text-blue-500',
                  bg: 'bg-blue-100'
                },
                {
                  icon: CheckCircleIcon,
                  title: 'Verified Users',
                  desc: 'All owners and renters are identity verified',
                  color: 'text-green-500',
                  bg: 'bg-green-100'
                },
                {
                  icon: StarIcon,
                  title: 'Trusted Reviews',
                  desc: 'Real reviews from real rentals',
                  color: 'text-yellow-500',
                  bg: 'bg-yellow-100'
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-4 py-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-white/90 mb-6">
            Join thousands of creators who rent and share gear on GearShare
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Create Free Account
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

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
            <Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
