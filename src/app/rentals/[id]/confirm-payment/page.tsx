'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import StripeProvider from '@/components/payments/StripeProvider';
import PaymentForm from '@/components/payments/PaymentForm';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Header from '@/components/Header';

interface RentalDetails {
  id: string;
  gear: {
    id: string;
    title: string;
    images: string[];
    dailyRate: number;
    insuranceRequired?: boolean;
    insuranceRate?: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentStatus?: string;
  totalPrice?: number;
  basePrice?: number;
  serviceFee?: number;
  hostingFee?: number;
  insurancePremium?: number;
  amount?: number;
}

export default function ConfirmPaymentPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async (rentalData: RentalDetails) => {
    try {
      const startDate = new Date(rentalData.startDate);
      const endDate = new Date(rentalData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Math.round(days * rentalData.gear.dailyRate * 100); // Convert to cents

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId: rentalData.id,
          amount,
          gearTitle: rentalData.gear.title,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await res.json();
      setRental(prev => prev ? { ...prev, clientSecret, amount } : null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup payment';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [setRental, setError]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirectTo=/rentals/' + id + '/confirm-payment');
      return;
    }

    const fetchRentalDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/rentals/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch rental details');
        }

        const rentalData = await res.json();
        setRental(rentalData);

        // Check if payment is already completed
        if (rentalData.paymentStatus === 'succeeded') {
          toast.success('Payment already completed!');
          router.push('/dashboard');
          return;
        }

        // If no client secret, create payment intent
        if (!rentalData.clientSecret) {
          await createPaymentIntent(rentalData);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchRentalDetails();
    }
  }, [user, authLoading, id, router, createPaymentIntent]);

  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const calculateAmount = (rental: RentalDetails) => {
    if (rental.amount) return rental.amount;
    
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(days * rental.gear.dailyRate * 100); // Convert to cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Payment Error</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Rental not found</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden flex flex-col">
      <Header />
      <div className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Rental Payment</h1>
            <p className="text-gray-600 mt-2">Secure your booking with a quick payment</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rental Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Image
                    src={rental.gear.images[0] || '/placeholder-gear.jpg'}
                    alt={rental.gear.title}
                    width={80}
                    height={80}
                    className="object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{rental.gear.title}</h3>
                    <p className="text-gray-600">${rental.gear.dailyRate}/day</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{formatDate(rental.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(rental.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>

                    {/* Price Breakdown */}
                    <div className="pt-3 mt-3 border-t border-dashed space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">Price Breakdown</div>

                      {rental.basePrice !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Rental</span>
                          <span className="font-medium">${rental.basePrice.toFixed(2)}</span>
                        </div>
                      )}

                      {rental.insurancePremium !== undefined && rental.insurancePremium > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Insurance Protection</span>
                          <span className="font-medium">${rental.insurancePremium.toFixed(2)}</span>
                        </div>
                      )}

                      {rental.serviceFee !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Fee (12%)</span>
                          <span className="font-medium">${rental.serviceFee.toFixed(2)}</span>
                        </div>
                      )}

                      {rental.hostingFee !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Technology Fee</span>
                          <span className="font-medium">${rental.hostingFee.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-3 border-t">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ${rental.totalPrice !== undefined
                          ? rental.totalPrice.toFixed(2)
                          : (calculateAmount(rental) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div>
                {rental.clientSecret ? (
                  <StripeProvider>
                    <PaymentForm
                      clientSecret={rental.clientSecret}
                      rentalId={rental.id}
                      amount={calculateAmount(rental)}
                      gearTitle={rental.gear.title}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </StripeProvider>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Setting up payment...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}