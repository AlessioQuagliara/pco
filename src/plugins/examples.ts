import type { Plugin, PluginContext } from '@/types';

/**
 * Example Analytics Plugin
 * Tracks checkout events and sends to analytics service
 */
const analyticsPlugin: Plugin = {
  name: 'analytics-tracker',
  version: '1.0.0',

  async beforeCheckoutInit(ctx: PluginContext): Promise<PluginContext> {
    console.log('[Analytics] Checkout initialized', {
      tenantId: ctx.tenantId,
      sessionId: ctx.sessionId,
    });

    // Send to analytics service
    // await fetch('/api/analytics', { ... });

    return ctx;
  },

  async beforePayment(ctx: PluginContext): Promise<PluginContext> {
    console.log('[Analytics] Payment initiated', {
      tenantId: ctx.tenantId,
      sessionId: ctx.sessionId,
      amount: ctx.checkoutData.cart?.total,
    });

    return ctx;
  },

  async afterPaymentSuccess(ctx: PluginContext): Promise<void> {
    console.log('[Analytics] Payment successful', {
      tenantId: ctx.tenantId,
      sessionId: ctx.sessionId,
    });

    // Track conversion
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Google Analytics conversion tracking
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'purchase', {
        transaction_id: ctx.sessionId,
        value: ctx.checkoutData.cart?.total,
        currency: ctx.checkoutData.cart?.currency,
      });
    }
  },

  async afterPaymentFailure(ctx: PluginContext): Promise<void> {
    console.log('[Analytics] Payment failed', {
      tenantId: ctx.tenantId,
      sessionId: ctx.sessionId,
    });
  },
};

/**
 * Example Fraud Detection Plugin
 * Validates checkout data for potential fraud
 */
const fraudDetectionPlugin: Plugin = {
  name: 'fraud-detector',
  version: '1.0.0',

  async onValidation(ctx: PluginContext): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Example: Check for suspicious patterns
    if (ctx.checkoutData.cart && ctx.checkoutData.cart.total > 10000) {
      console.log('[FraudDetection] High value transaction detected');
      // In production, call fraud detection API
    }

    // Example: Validate shipping address
    if (ctx.checkoutData.shippingAddress) {
      const { email } = ctx.checkoutData.shippingAddress;
      if (email.includes('test') || email.includes('fake')) {
        errors.push('Suspicious email address detected');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

/**
 * Example Email Notification Plugin
 * Sends emails at different checkout stages
 */
const emailNotificationPlugin: Plugin = {
  name: 'email-notifier',
  version: '1.0.0',

  async afterPaymentSuccess(ctx: PluginContext): Promise<void> {
    const customerEmail = ctx.checkoutData.shippingAddress?.email;
    console.log('[EmailNotifier] Sending order confirmation email to', customerEmail);

    // In production, call email service
    // await sendEmail({
    //   to: customerEmail,
    //   template: 'order-confirmation',
    //   data: { orderId: ctx.sessionId, ... }
    // });
  },

  async afterPaymentFailure(_ctx: PluginContext): Promise<void> {
    console.log('[EmailNotifier] Sending payment failure notification');

    // Optionally notify customer of payment failure
  },
};

/**
 * Example Loyalty Points Plugin
 * Awards loyalty points after successful purchase
 */
const loyaltyPointsPlugin: Plugin = {
  name: 'loyalty-points',
  version: '1.0.0',

  async afterPaymentSuccess(ctx: PluginContext): Promise<void> {
    const amount = ctx.checkoutData.cart?.total || 0;
    const customerEmail = ctx.checkoutData.shippingAddress?.email;
    const points = Math.floor(amount / 10); // 1 point per €10

    console.log(`[LoyaltyPoints] Awarding ${points} points to customer ${customerEmail}`);

    // In production, call loyalty API
    // await awardPoints({
    //   customerId: customerEmail,
    //   points,
    //   orderId: ctx.sessionId,
    // });
  },
};

// Export all example plugins
export const examplePlugins = [
  analyticsPlugin,
  fraudDetectionPlugin,
  emailNotificationPlugin,
  loyaltyPointsPlugin,
];
