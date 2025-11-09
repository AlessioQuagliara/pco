'use client';

import { useCheckout } from '@/contexts/CheckoutContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function CheckoutPage() {
  const { session } = useCheckout();

  // Temporary test: Show something even without session
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold">Tailwind CSS Test</h2>
            <p className="mt-2">Se vedi questo con stili applicati, Tailwind funziona!</p>
          </div>
        </div>
      </div>
    );
  }

  const { cart } = session;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Carrello</h2>
          
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Il tuo carrello è vuoto</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Continua lo shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Quantità: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity, cart.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.price, cart.currency)} cad.
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t">
                <Link
                  href="/checkout/shipping"
                  className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Procedi al checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
          <h2 className="text-xl font-semibold mb-4">Riepilogo ordine</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotale</span>
              <span>{formatCurrency(cart.subtotal, cart.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Spedizione</span>
              <span>
                {cart.shipping > 0
                  ? formatCurrency(cart.shipping, cart.currency)
                  : 'Da calcolare'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA</span>
              <span>{formatCurrency(cart.tax, cart.currency)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Totale</span>
              <span>{formatCurrency(cart.total, cart.currency)}</span>
            </div>
          </div>

          {cart.items.length > 0 && (
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Pagamenti sicuri</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Protezione acquirente</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
