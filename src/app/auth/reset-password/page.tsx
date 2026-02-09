'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Header from '@/components/Header';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function exchangeCode() {
      if (!code) {
        setExchangeError('Invalid or expired reset link. Please request a new one.');
        setIsExchanging(false);
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setExchangeError('This reset link has expired or is invalid. Please request a new one.');
        }
      } catch {
        setExchangeError('Something went wrong. Please request a new reset link.');
      } finally {
        setIsExchanging(false);
      }
    }

    exchangeCode();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      toast.error((err as Error)?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      <Header />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="py-8">
          <div className="max-w-md mx-auto">

            {/* Success state */}
            {success && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
                <p className="text-gray-600 mb-6">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Loading / exchanging code */}
            {!success && isExchanging && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Verifying reset link...</p>
              </div>
            )}

            {/* Exchange error */}
            {!success && !isExchanging && exchangeError && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
                <p className="text-gray-600 mb-6">{exchangeError}</p>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Request new link
                </Link>
              </div>
            )}

            {/* New password form */}
            {!success && !isExchanging && !exchangeError && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Create new password</h1>
                  <p className="mt-2 text-gray-600">
                    Choose a new password for your account.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New password
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <Input
                          type="password"
                          id="password"
                          name="password"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm password
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <Input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="w-full pl-10"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !password || !confirmPassword}
                      className="w-full py-3"
                    >
                      {isLoading ? 'Updating...' : 'Update password'}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
