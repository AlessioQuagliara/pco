import { NextRequest, NextResponse } from 'next/server';
import { tenantMiddleware, loggingMiddleware } from '@/lib/middleware';
import { createApiResponse } from '@/lib/utils';
import { linkBayApi } from '@/lib/linkbay-api';

/**
 * Create PayPal Order
 * POST /api/paypal/create-order
 */
async function handleCreateOrder(req: NextRequest, tenantId: string) {
  try {
    const tenant = await linkBayApi.getTenant(tenantId);

    if (!tenant.paypalConfig || !tenant.paypalConfig.enabled) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'PAYPAL_NOT_ENABLED',
          message: 'PayPal is not enabled for this tenant',
        }),
        { status: 400 }
      );
    }

    const { amount, currency, sessionId } = await req.json();

    const base = tenant.paypalConfig.mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    // Get PayPal access token
    const authResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${tenant.paypalConfig.clientId}:${tenant.paypalConfig.clientSecret}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with PayPal');
    }

    const { access_token } = await authResponse.json() as { access_token: string };

    // Create order
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            custom_id: `${tenantId}:${sessionId}`,
          },
        ],
        application_context: {
          brand_name: tenant.name,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      throw new Error(`PayPal order creation failed: ${JSON.stringify(error)}`);
    }

    const order = await orderResponse.json() as { id: string };

    // Record metrics
    await linkBayApi.recordMetrics(tenantId, {
      sessionId: sessionId || 'unknown',
      event: 'started',
      metadata: { paymentMethod: 'paypal' },
    });

    return NextResponse.json(createApiResponse(true, { orderId: order.id }));
  } catch (error) {
    console.error('Error creating PayPal order:', error);

    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'PAYPAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create PayPal order',
      }),
      { status: 500 }
    );
  }
}

export const POST = loggingMiddleware(tenantMiddleware(handleCreateOrder));
