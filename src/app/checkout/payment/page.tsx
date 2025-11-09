'use client';

import { useState, useEffect } from 'react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import StripePaymentForm from '@/components/StripePaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentPage() {
  const { session, selectPaymentMethod } = useCheckout();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.shippingAddress) {
      router.push('/checkout/shipping');
    }
  }, [session, router]);

  useEffect(() => {
    if (selectedMethod === 'stripe' && session) {
      createPaymentIntent();
    }
  }, [selectedMethod, session]);

  const createPaymentIntent = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': session.tenantId,
        },
        body: JSON.stringify({
          amount: session.cart.total,
          currency: session.cart.currency,
          metadata: {
            sessionId: session.id,
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.clientSecret) {
        setClientSecret(result.data.clientSecret);
      } else {
        console.error('Failed to create payment intent:', result.error);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalApprove = async (orderId: string) => {
    if (!session) return;

    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': session.tenantId,
        },
        body: JSON.stringify({
          orderId,
          sessionId: session.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push('/checkout/confirmation');
      } else {
        console.error('PayPal capture failed:', result.error);
      }
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
    }
  };

  const createPayPalOrder = async () => {
    if (!session) return '';

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': session.tenantId,
        },
        body: JSON.stringify({
          amount: session.cart.total,
          currency: session.cart.currency,
          sessionId: session.id,
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.orderId) {
        return result.data.orderId;
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
    }
    return '';
  };

  if (!session) {
    return <div className="text-center py-12">Caricamento...</div>;
  }

  const stripeOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/checkout/shipping"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Torna alla spedizione
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Metodo di pagamento</h2>

            {/* Payment Method Selection */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setSelectedMethod('stripe');
                  selectPaymentMethod('stripe');
                }}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  selectedMethod === 'stripe'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedMethod === 'stripe' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {selectedMethod === 'stripe' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="font-medium">Carta di credito / debito</span>
                  </div>
                  <div className="flex gap-2">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedMethod('paypal');
                  selectPaymentMethod('paypal');
                }}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedMethod === 'paypal' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {selectedMethod === 'paypal' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="font-medium">PayPal</span>
                  </div>
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-6" />
                </div>
              </button>
            </div>

            {/* Payment Forms */}
            {selectedMethod === 'stripe' && (
              <div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Inizializzazione pagamento...</p>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={stripeOptions}>
                    <StripePaymentForm />
                  </Elements>
                ) : (
                  <div className="text-center py-8 text-red-600">
                    Errore nell'inizializzazione del pagamento
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'paypal' && (
              <div>
                <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '' }}>
                  <PayPalButtons
                    createOrder={createPayPalOrder}
                    onApprove={(data) => handlePayPalApprove(data.orderID)}
                    style={{ layout: 'vertical' }}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Riepilogo ordine</h3>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotale</span>
                <span>{formatCurrency(session.cart.subtotal, session.cart.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spedizione</span>
                <span>{formatCurrency(session.cart.shipping, session.cart.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA</span>
                <span>{formatCurrency(session.cart.tax, session.cart.currency)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Totale</span>
                <span>{formatCurrency(session.cart.total, session.cart.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
