import { NextRequest, NextResponse } from 'next/server';
import { tenantMiddleware, loggingMiddleware } from '@/lib/middleware';
import { createApiResponse } from '@/lib/utils';
import { linkBayApi } from '@/lib/linkbay-api';

/**
 * Capture PayPal Order
 * POST /api/paypal/capture-order
 */
async function handleCaptureOrder(req: NextRequest, tenantId: string) {
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

    const { orderId, sessionId } = await req.json();

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

    // Capture order
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      throw new Error(`PayPal capture failed: ${JSON.stringify(error)}`);
    }

    const captureData = await captureResponse.json() as {
      id: string;
      status: string;
      purchase_units: Array<{
        payments: {
          captures: Array<{
            id: string;
            amount: { value: string; currency_code: string };
          }>;
        };
      }>;
    };

    // Send webhook to LinkBay Core
    await linkBayApi.sendWebhookEvent({
      type: 'payment.succeeded',
      tenantId,
      data: {
        paymentId: captureData.id,
        captureId: captureData.purchase_units[0]?.payments.captures[0]?.id,
        amount: parseFloat(captureData.purchase_units[0]?.payments.captures[0]?.amount.value || '0'),
        currency: captureData.purchase_units[0]?.payments.captures[0]?.amount.currency_code,
        sessionId,
      },
    });

    // Record metrics
    await linkBayApi.recordMetrics(tenantId, {
      sessionId: sessionId || 'unknown',
      event: 'completed',
      metadata: {
        paymentMethod: 'paypal',
        amount: parseFloat(captureData.purchase_units[0]?.payments.captures[0]?.amount.value || '0'),
      },
    });

    return NextResponse.json(
      createApiResponse(true, {
        captureId: captureData.purchase_units[0]?.payments.captures[0]?.id,
        status: captureData.status,
      })
    );
  } catch (error) {
    console.error('Error capturing PayPal order:', error);

    // Record failure metric
    const { sessionId } = await req.json().catch(() => ({ sessionId: 'unknown' }));
    await linkBayApi.recordMetrics(tenantId, {
      sessionId,
      event: 'payment_failed',
      metadata: {
        paymentMethod: 'paypal',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }).catch(console.error);

    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'PAYPAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to capture PayPal order',
      }),
      { status: 500 }
    );
  }
}

export const POST = loggingMiddleware(tenantMiddleware(handleCaptureOrder));
