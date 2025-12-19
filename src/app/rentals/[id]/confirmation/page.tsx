'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface RentalDetails {
  id: string;
  gear: {
    id: string;
    title: string;
    images: string[];
    dailyRate: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
}

import Header from '@/components/Header';

interface RentalDetails {
  id: string;
  gear: {
    id: string;
    title: string;
    images: string[];
    dailyRate: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
}

export default function PaymentConfirmationPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'processing' | 'failed' | 'unknown'>('unknown');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        setLoading(true);

        // Get payment intent status from URL params
        const redirectStatus = searchParams?.get('redirect_status');

        if (redirectStatus === 'succeeded') {
          setPaymentStatus('success');
          toast.success('Payment completed successfully!');
        } else if (redirectStatus === 'processing') {
          setPaymentStatus('processing');
          toast.loading('Payment is being processed...');
        } else if (redirectStatus === 'failed') {
          setPaymentStatus('failed');
          toast.error('Payment failed. Please try again.');
        }

        // Fetch rental details
        const res = await fetch(`/api/rentals/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch rental details');
        }

        const rentalData = await res.json();
        setRental(rentalData);

        // Double-check payment status from our database
        if (rentalData.paymentStatus === 'succeeded') {
          setPaymentStatus('success');
        } else if (rentalData.paymentStatus === 'processing') {
          setPaymentStatus('processing');
        } else if (rentalData.paymentStatus === 'failed') {
          setPaymentStatus('failed');
        }

      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('failed');
        toast.error('Failed to confirm payment status');
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      checkPaymentStatus();
    }
  }, [user, authLoading, id, router, searchParams]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const calculateAmount = (rental: RentalDetails) => {
    if (rental.amount) return rental.amount;
    
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(days * rental.gear.dailyRate * 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Confirming payment...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-yellow-100 rounded-full">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your rental payment has been processed successfully. You will receive a confirmation email shortly.',
          color: 'text-green-900'
        };
      case 'processing':
        return {
          title: 'Payment Processing',
          message: 'Your payment is being processed. This may take a few minutes. Please check back soon.',
          color: 'text-yellow-900'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support if the issue persists.',
          color: 'text-red-900'
        };
      default:
        return {
          title: 'Payment Status Unknown',
          message: 'We are unable to determine your payment status. Please contact support for assistance.',
          color: 'text-gray-900'
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-grow py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {getStatusIcon()}
            
            <h1 className={`text-3xl font-bold mb-4 ${statusMessage.color}`}>
              {statusMessage.title}
            </h1>
            
            <p className="text-gray-600 mb-8 text-lg">
              {statusMessage.message}
            </p>

            {rental && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Details</h2>
                
                <div className="flex items-start space-x-4 mb-4">
                  <Image
                    src={rental.gear.images[0] || '/placeholder-gear.jpg'}
                    alt={rental.gear.title}
                    width={64}
                    height={64}
                    className="object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{rental.gear.title}</h3>
                    <p className="text-gray-600">${rental.gear.dailyRate}/day</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <p className="font-medium">{formatDate(rental.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <p className="font-medium">{formatDate(rental.endDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">
                      {Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(calculateAmount(rental))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to Dashboard
              </Link>
              
              {paymentStatus === 'failed' && rental && (
                <Link
                  href={`/rentals/${rental.id}/confirm-payment`}
                  className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Try Again
                </Link>
              )}
              
              {paymentStatus === 'success' && rental && (
                <Link
                  href={`/gear/${rental.gear.id}`}
                  className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  View Gear
                </Link>
              )}
            </div>

            {paymentStatus === 'success' && (
              <div className="mt-8 text-sm text-gray-500">
                <p>Need help? Contact our support team at support@gearshare.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>  );
}