import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createApiResponse } from '@/lib/utils';
import { linkBayApi } from '@/lib/linkbay-api';

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'MISSING_SIGNATURE',
        message: 'Missing Stripe signature',
      }),
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'WEBHOOK_NOT_CONFIGURED',
        message: 'Webhook secret not configured',
      }),
      { status: 500 }
    );
  }

  try {
    // Verify webhook signature
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-10-29.clover',
    });

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Extract tenant ID from metadata
    const metadata = 'metadata' in event.data.object ? event.data.object.metadata : undefined;
    const tenantId = metadata?.tenantId as string | undefined;

    if (!tenantId) {
      console.error('Missing tenantId in webhook event metadata');
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'MISSING_TENANT_ID',
          message: 'Missing tenantId in event metadata',
        }),
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Event: ${event.type}, Tenant: ${tenantId}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Send webhook to LinkBay Core
        await linkBayApi.sendWebhookEvent({
          type: 'payment.succeeded',
          tenantId,
          data: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
          },
        });

        // Record metrics
        await linkBayApi.recordMetrics(tenantId, {
          sessionId: paymentIntent.metadata.sessionId || 'unknown',
          event: 'completed',
          metadata: {
            paymentMethod: 'stripe',
            amount: paymentIntent.amount / 100,
          },
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await linkBayApi.sendWebhookEvent({
          type: 'payment.failed',
          tenantId,
          data: {
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
            metadata: paymentIntent.metadata,
          },
        });

        await linkBayApi.recordMetrics(tenantId, {
          sessionId: paymentIntent.metadata.sessionId || 'unknown',
          event: 'payment_failed',
          metadata: {
            paymentMethod: 'stripe',
            error: paymentIntent.last_payment_error?.code,
          },
        });

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        await linkBayApi.sendWebhookEvent({
          type: 'order.updated',
          tenantId,
          data: {
            chargeId: charge.id,
            status: 'refunded',
            amount: charge.amount_refunded / 100,
          },
        });

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json(createApiResponse(true, { received: true }));
  } catch (error) {
    console.error('Stripe webhook error:', error);

    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 400 }
    );
  }
}
