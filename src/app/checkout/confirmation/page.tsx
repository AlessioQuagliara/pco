'use client';

import { useEffect } from 'react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function ConfirmationPage() {
  const { session } = useCheckout();

  useEffect(() => {
    // Clear session after successful checkout (with delay to show confirmation)
    const timer = setTimeout(() => {
      // In production, only reset after confirming order is saved
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Ordine confermato!</h1>
        <p className="text-center text-gray-600 mb-8">
          Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
        </p>

        {/* Order Details */}
        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Indirizzo di spedizione</h3>
              {session.shippingAddress && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{session.shippingAddress.firstName} {session.shippingAddress.lastName}</p>
                  <p>{session.shippingAddress.addressLine1}</p>
                  {session.shippingAddress.addressLine2 && <p>{session.shippingAddress.addressLine2}</p>}
                  <p>
                    {session.shippingAddress.city}, {session.shippingAddress.state} {session.shippingAddress.postalCode}
                  </p>
                  <p>{session.shippingAddress.country}</p>
                  <p className="mt-2">{session.shippingAddress.email}</p>
                  <p>{session.shippingAddress.phone}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Metodo di pagamento</h3>
              <div className="text-sm text-gray-600">
                <p className="capitalize">{session.selectedPaymentMethod || 'Non specificato'}</p>
              </div>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">Riepilogo ordine</h3>
              <div className="text-sm space-y-1">
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
                <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2">
                  <span>Totale</span>
                  <span>{formatCurrency(session.cart.total, session.cart.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Articoli ordinati</h3>
          <div className="space-y-3">
            {session.cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantità: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(item.price * item.quantity, session.cart.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Prossimi passi</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Riceverai una email di conferma all'indirizzo fornito</li>
            <li>• Il tuo ordine verrà processato entro 1-2 giorni lavorativi</li>
            <li>• Riceverai le informazioni di tracking una volta spedito</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Torna alla home
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Stampa ricevuta
          </button>
        </div>
      </div>
    </div>
  );
}
