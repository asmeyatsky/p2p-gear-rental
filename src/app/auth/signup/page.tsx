'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { event } from '@/lib/gtag';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signUp(email, password, name);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      event({
        action: 'sign_up',
        category: 'authentication',
        label: 'new_user_signup',
        value: 1,
      });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 px-1 py-1 min-h-screen flex flex-col justify-center">
        <div className="py-4">
          <div className="max-w-md mx-auto px-2">
            <div className="text-center mb-4">
              <Link href="/" className="inline-flex items-center gap-1 text-lg font-bold text-white hover:text-gray-300 transition-colors">
                <span className="text-xl">⚙️</span>
                <span className="text-sm">GearShare</span>
              </Link>
              <h2 className="mt-3 text-xl font-bold text-white">Create an account</h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Get started with your free account
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
              <form className="mt-3 space-y-3" onSubmit={handleSignup}>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-0.5">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      className="appearance-none relative block w-full px-2.5 py-1.5 border border-white/20 placeholder:text-gray-500 text-white bg-white/10 rounded focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 text-xs"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email-address" className="block text-xs font-medium text-gray-300 mb-0.5">
                      Email Address
                    </label>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none relative block w-full px-2.5 py-1.5 border border-white/20 placeholder:text-gray-500 text-white bg-white/10 rounded focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 text-xs"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-0.5">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none relative block w-full px-2.5 py-1.5 border border-white/20 placeholder:text-gray-500 text-white bg-white/10 rounded focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 text-xs"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center py-1.5 px-3 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create account
                  </button>
                </div>
              </form>

              <div className="mt-3 text-[10px] text-center">
                <p>
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-medium text-blue-400 hover:text-blue-300">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
