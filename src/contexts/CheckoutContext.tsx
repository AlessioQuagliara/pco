'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CheckoutSession, Cart, ShippingAddress, PaymentMethod } from '@/types';
import { storage, generateSessionId } from '@/lib/utils';

interface CheckoutContextType {
  session: CheckoutSession | null;
  updateCart: (cart: Cart) => void;
  updateShippingAddress: (address: ShippingAddress) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;
  selectShippingMethod: (methodId: string) => void;
  resetSession: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const STORAGE_KEY = 'fastcheckout_session';

export function CheckoutProvider({
  children,
  tenantId,
}: {
  children: ReactNode;
  tenantId: string;
}) {
  const [session, setSession] = useState<CheckoutSession | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = storage.get<CheckoutSession>(STORAGE_KEY);
    if (savedSession && savedSession.tenantId === tenantId) {
      setSession(savedSession);
    } else {
      // Initialize new session
      const newSession: CheckoutSession = {
        id: generateSessionId(),
        tenantId,
        cart: {
          items: [],
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          currency: 'EUR',
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSession(newSession);
      storage.set(STORAGE_KEY, newSession);
    }
  }, [tenantId]);

  // Save to localStorage whenever session changes
  useEffect(() => {
    if (session) {
      storage.set(STORAGE_KEY, {
        ...session,
        updatedAt: new Date(),
      });
    }
  }, [session]);

  const updateCart = (cart: Cart) => {
    setSession((prev) => (prev ? { ...prev, cart } : null));
  };

  const updateShippingAddress = (address: ShippingAddress) => {
    setSession((prev) => (prev ? { ...prev, shippingAddress: address } : null));
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setSession((prev) => (prev ? { ...prev, selectedPaymentMethod: method } : null));
  };

  const selectShippingMethod = (methodId: string) => {
    setSession((prev) => (prev ? { ...prev, selectedShippingMethod: methodId } : null));
  };

  const resetSession = () => {
    storage.remove(STORAGE_KEY);
    const newSession: CheckoutSession = {
      id: generateSessionId(),
      tenantId,
      cart: {
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        currency: 'EUR',
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSession(newSession);
  };

  return (
    <CheckoutContext.Provider
      value={{
        session,
        updateCart,
        updateShippingAddress,
        selectPaymentMethod,
        selectShippingMethod,
        resetSession,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
