// FastCheckOut - Core Type Definitions

export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  brandColor?: string;
  enabledPaymentMethods: PaymentMethod[];
  currency: string;
  taxRate: number;
  shippingConfig: ShippingConfig;
  stripeConfig?: StripeConfig;
  paypalConfig?: PayPalConfig;
}

export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  enabled: boolean;
}

export interface ShippingConfig {
  methods: ShippingMethod[];
  freeShippingThreshold?: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export type PaymentMethod = 'stripe' | 'paypal';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutSession {
  id: string;
  tenantId: string;
  cart: Cart;
  shippingAddress?: ShippingAddress;
  selectedShippingMethod?: string;
  selectedPaymentMethod?: PaymentMethod;
  status: CheckoutStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export type CheckoutStatus =
  | 'pending'
  | 'processing'
  | 'payment_required'
  | 'completed'
  | 'failed'
  | 'abandoned';

export interface Order {
  id: string;
  tenantId: string;
  sessionId: string;
  orderNumber: string;
  cart: Cart;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  paymentIntentId: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

// Plugin System Types
export interface PluginContext {
  tenantId: string;
  sessionId: string;
  checkoutData: Partial<CheckoutSession>;
}

export interface Plugin {
  name: string;
  version: string;
  beforeCheckoutInit?: (ctx: PluginContext) => Promise<PluginContext>;
  beforePayment?: (ctx: PluginContext) => Promise<PluginContext>;
  afterPaymentSuccess?: (ctx: PluginContext) => Promise<void>;
  afterPaymentFailure?: (ctx: PluginContext) => Promise<void>;
  onValidation?: (ctx: PluginContext) => Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// Analytics & Metrics
export interface CheckoutMetrics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  completedCheckouts: number;
  conversionRate: number;
  averageCompletionTime: number;
  abandonmentRate: number;
  abandonmentByStep: Record<string, number>;
  paymentErrorBreakdown: Record<string, number>;
  revenueByPaymentMethod: Record<PaymentMethod, number>;
  totalRevenue: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  tenantId: string;
  data: unknown;
  timestamp: Date;
}

export type WebhookEventType =
  | 'checkout.completed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'order.created'
  | 'order.updated';
