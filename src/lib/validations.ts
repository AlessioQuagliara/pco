import { z } from 'zod';

// Shipping Address Validation Schema
export const shippingAddressSchema = z.object({
  firstName: z.string().min(2, 'Nome deve contenere almeno 2 caratteri').max(50),
  lastName: z.string().min(2, 'Cognome deve contenere almeno 2 caratteri').max(50),
  email: z.string().email('Email non valida'),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Numero di telefono non valido'),
  addressLine1: z.string().min(5, 'Indirizzo deve contenere almeno 5 caratteri').max(100),
  addressLine2: z.string().max(100).optional(),
  city: z.string().min(2, 'Città deve contenere almeno 2 caratteri').max(50),
  state: z.string().min(2, 'Provincia/Stato deve contenere almeno 2 caratteri').max(50),
  postalCode: z.string().min(3, 'CAP non valido').max(10),
  country: z.string().length(2, 'Codice paese deve essere di 2 caratteri (ISO 3166-1 alpha-2)'),
});

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;

// Cart Item Validation
export const cartItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive('Il prezzo deve essere positivo'),
  quantity: z.number().int().positive('La quantità deve essere almeno 1'),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Il carrello non può essere vuoto'),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().positive(),
  currency: z.string().length(3, 'Valuta deve essere in formato ISO 4217'),
});

// Payment Method Selection
export const paymentMethodSchema = z.enum(['stripe', 'paypal']);

// Checkout Session Schema
export const checkoutSessionSchema = z.object({
  tenantId: z.string().uuid(),
  cart: cartSchema,
  shippingAddress: shippingAddressSchema.optional(),
  selectedShippingMethod: z.string().optional(),
  selectedPaymentMethod: paymentMethodSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Tenant Configuration Schema
export const tenantConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  logo: z.string().url().optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  enabledPaymentMethods: z.array(paymentMethodSchema).min(1),
  currency: z.string().length(3),
  taxRate: z.number().min(0).max(1),
  stripeConfig: z.object({
    publicKey: z.string().startsWith('pk_'),
    secretKey: z.string().startsWith('sk_'),
    webhookSecret: z.string().startsWith('whsec_'),
    enabled: z.boolean(),
  }).optional(),
  paypalConfig: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    mode: z.enum(['sandbox', 'live']),
    enabled: z.boolean(),
  }).optional(),
});

// API Request Schemas
export const createPaymentIntentSchema = z.object({
  tenantId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const capturePayPalOrderSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string(),
});

// Webhook Event Schema
export const webhookEventSchema = z.object({
  type: z.enum([
    'checkout.completed',
    'payment.succeeded',
    'payment.failed',
    'order.created',
    'order.updated',
  ]),
  tenantId: z.string().uuid(),
  data: z.unknown(),
});

export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
