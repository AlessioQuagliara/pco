import { NextRequest, NextResponse } from 'next/server';
import { tenantMiddleware, loggingMiddleware } from '@/lib/middleware';
import { createApiResponse } from '@/lib/utils';
import { linkBayApi } from '@/lib/linkbay-api';

/**
 * Get Checkout Analytics
 * GET /api/analytics/checkout?startDate=...&endDate=...
 */
async function handleGetAnalytics(req: NextRequest, tenantId: string) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate query parameters are required',
        }),
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format. Use ISO 8601 format',
        }),
        { status: 400 }
      );
    }

    // Fetch analytics from LinkBay Core
    const analytics = await linkBayApi.getCheckoutAnalytics(tenantId, startDate, endDate);

    return NextResponse.json(createApiResponse(true, analytics));
  } catch (error) {
    console.error('Error fetching analytics:', error);

    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch analytics',
      }),
      { status: 500 }
    );
  }
}

export const GET = loggingMiddleware(tenantMiddleware(handleGetAnalytics));
