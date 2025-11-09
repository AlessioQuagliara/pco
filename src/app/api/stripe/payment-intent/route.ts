import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { tenantMiddleware, loggingMiddleware } from '@/lib/middleware';
import { createApiResponse } from '@/lib/utils';
import { linkBayApi } from '@/lib/linkbay-api';
import { createPaymentIntentSchema } from '@/lib/validations';

/**
 * Create Stripe Payment Intent
 * POST /api/stripe/payment-intent
 */
async function handleCreatePaymentIntent(req: NextRequest, tenantId: string) {
  try {
    // Get tenant configuration to retrieve Stripe keys
    const tenant = await linkBayApi.getTenant(tenantId);

    if (!tenant.stripeConfig || !tenant.stripeConfig.enabled) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'STRIPE_NOT_ENABLED',
          message: 'Stripe is not enabled for this tenant',
        }),
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = createPaymentIntentSchema.parse({
      ...body,
      tenantId,
    });

    // Initialize Stripe with tenant-specific secret key
    const stripe = new Stripe(tenant.stripeConfig.secretKey, {
      apiVersion: '2025-10-29.clover',
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount * 100), // Convert to cents
      currency: validatedData.currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        tenantId,
        ...validatedData.metadata,
      },
    });

    // Record metrics
    await linkBayApi.recordMetrics(tenantId, {
      sessionId: validatedData.metadata?.sessionId as string || 'unknown',
      event: 'started',
      metadata: { paymentMethod: 'stripe' },
    });

    return NextResponse.json(
      createApiResponse(true, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);

    if (error instanceof Error && 'type' in error) {
      // Stripe-specific error
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'STRIPE_ERROR',
          message: error.message,
        }),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

export const POST = loggingMiddleware(tenantMiddleware(handleCreatePaymentIntent));
