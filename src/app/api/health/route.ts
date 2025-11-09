import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/utils';

/**
 * Health Check Endpoint
 * GET /api/health
 */
export async function GET() {
  // Basic health check
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  // Check connectivity to external services (optional)
  const checks: Record<string, string> = {
    linkbay: 'unknown',
    stripe: 'unknown',
    paypal: 'unknown',
  };

  try {
    // Quick connectivity checks could go here
    // For now, just return basic health
    checks.linkbay = 'configured';
    checks.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured';
    checks.paypal = process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not_configured';

    return NextResponse.json(
      createApiResponse(true, {
        ...health,
        services: checks,
      })
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'HEALTH_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Health check failed',
      }),
      { status: 503 }
    );
  }
}
