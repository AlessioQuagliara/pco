import { ReactNode } from 'react';
import { CheckoutProvider } from '@/contexts/CheckoutContext';

export default function CheckoutLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ tenantId?: string }>;
}) {
  // In production, extract tenantId from subdomain or path
  // For now, use default tenant
  const tenantId = 'default-tenant-id'; // TODO: Extract from subdomain/config

  return (
    <CheckoutProvider tenantId={tenantId}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">FastCheckOut</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </CheckoutProvider>
  );
}
