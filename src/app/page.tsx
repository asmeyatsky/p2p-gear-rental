'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-2 py-1"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">GearShare</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-xs text-gray-300 hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/auth/login" className="text-xs text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-xs bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 px-2 pt-3 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full mb-2 border border-white/20"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-gray-200">The #1 Gear Rental Platform</span>
            </motion.div>

            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
              Rent Pro Gear
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create Amazing
              </span>
            </h1>

            <p className="text-xs text-gray-400 max-w-md mx-auto mb-3">
              Access professional cameras, lenses, and equipment from local owners.
              Save money, reduce waste, and create stunning content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/browse"
                  className="group flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                >
                  <CameraIcon className="w-3 h-3" />
                  Rent
                  <ArrowRightIcon className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/add-gear"
                  className="group flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all"
                >
                  <CurrencyDollarIcon className="w-3 h-3" />
                  List
                  <ArrowRightIcon className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto mb-8"
          >
            {[
              { value: '10K+', label: 'Gear Items', icon: CameraIcon },
              { value: '5K+', label: 'Happy Renters', icon: StarIcon },
              { value: '2K+', label: 'Owners Earning', icon: CurrencyDollarIcon },
              { value: '100+', label: 'Cities', icon: MapPinIcon },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10 text-center"
              >
                <stat.icon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">{stat.value}</div>
                <div className="text-[9px] text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Browse by Category
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 max-w-4xl mx-auto">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <Link
                    href={cat.href}
                    className="block bg-white/5 backdrop-blur-sm rounded-md p-1.5 border border-white/10 hover:border-white/30 transition-all text-center group"
                  >
                    <div className={`text-lg mb-0.5 group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <div className="text-[9px] text-gray-300 font-medium">{cat.name}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-2 py-6 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-lg font-bold text-white mb-4"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* For Renters */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">For Renters</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Browse thousands of items near you',
                  'Book instantly with secure payments',
                  'Pick up gear and start creating',
                  'Return and leave a review'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} className="mt-4">
                <Link
                  href="/browse"
                  className="block text-center bg-blue-500 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
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
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">For Owners</h3>
              </div>
              <div className="space-y-3">
                {[
                  'List your gear in minutes',
                  'Set your own prices and availability',
                  'Approve rental requests',
                  'Earn money from your equipment'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-green-400">{i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} className="mt-4">
                <Link
                  href="/add-gear"
                  className="block text-center bg-green-500 text-white py-2.5 rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm"
                >
                  List Your Gear
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 px-2 py-6 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10"
          >
            <h2 className="text-center text-base font-bold text-white mb-3">
              Why Choose GearShare?
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: 'Fully Insured',
                  desc: 'Every rental is protected with comprehensive coverage',
                  color: 'text-blue-400'
                },
                {
                  icon: CheckCircleIcon,
                  title: 'Verified Users',
                  desc: 'All owners and renters are identity verified',
                  color: 'text-green-400'
                },
                {
                  icon: StarIcon,
                  title: 'Trusted Reviews',
                  desc: 'Real reviews from real rentals',
                  color: 'text-yellow-400'
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
                  <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-2.5`} />
                  <h3 className="text-white font-semibold text-sm mb-0.5">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-2 py-6 bg-black/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">
            Ready to Get Started?
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Join thousands of creators who rent and share gear on GearShare
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              Create Free Account
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-2 py-2 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-400">© 2024 GearShare</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
