'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  clientSecret: string;
  rentalId: string;
  amount: number;
  gearTitle: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({
  clientSecret,
  rentalId,
  amount,
  gearTitle,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) return;

    if (!clientSecret) {
      setMessage('Payment setup error. Please try again.');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          onSuccess?.();
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Please complete your payment information.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/rentals/${rentalId}/confirmation`,
        receipt_email: user?.email,
      },
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'Payment failed');
        onError?.(error.message || 'Payment failed');
      } else {
        setMessage('An unexpected error occurred.');
        onError?.('An unexpected error occurred.');
      }
      toast.error('Payment failed. Please try again.');
    } else {
      // Payment succeeded
      toast.success('Payment completed successfully!');
      onSuccess?.();
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{gearTitle}</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatCurrency(amount)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Rental ID: {rentalId}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Information
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
            />
          </div>
        </div>

        {/* Address Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Address
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <AddressElement 
              options={{
                mode: 'billing',
                allowedCountries: ['US', 'CA'],
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay ${formatCurrency(amount)}`
          )}
        </button>

        {/* Status Message */}
        {message && (
          <div
            className={`text-center text-sm p-3 rounded-md ${
              message.includes('succeeded') || message.includes('processing')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </form>

      {/* Security Notice */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center mb-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secured by Stripe
        </div>
        <p>Your payment information is encrypted and secure.</p>
      </div>
    </div>
  );
}