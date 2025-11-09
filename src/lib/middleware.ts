import { NextRequest, NextResponse } from 'next/server';
import { extractTenantId, createApiResponse } from './utils';

/**
 * Multi-tenant middleware to extract and validate tenant ID from headers
 */
export function tenantMiddleware(handler: (req: NextRequest, tenantId: string) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const tenantId = extractTenantId(req.headers);

    if (!tenantId) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        }),
        { status: 400 }
      );
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INVALID_TENANT_ID',
          message: 'X-Tenant-ID must be a valid UUID',
        }),
        { status: 400 }
      );
    }

    try {
      return await handler(req, tenantId);
    } catch (error) {
      console.error('Error in tenant middleware:', error);
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500 }
      );
    }
  };
}

/**
 * Rate limiting middleware
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  maxRequests = 100,
  windowMs = 15 * 60 * 1000 // 15 minutes
) {
  return async (req: NextRequest, next: () => Promise<NextResponse>): Promise<NextResponse> => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const identifier = extractTenantId(req.headers) || ip || 'anonymous';
    const now = Date.now();

    const record = rateLimitStore.get(identifier);

    if (record) {
      if (now < record.resetTime) {
        if (record.count >= maxRequests) {
          return NextResponse.json(
            createApiResponse(false, undefined, {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
            }),
            {
              status: 429,
              headers: {
                'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
              },
            }
          );
        }
        record.count++;
      } else {
        // Reset window
        record.count = 1;
        record.resetTime = now + windowMs;
      }
    } else {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
    }

    return next();
  };
}

/**
 * CSRF protection middleware
 */
export function csrfMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req);
    }

    const csrfToken = req.headers.get('x-csrf-token');
    const cookieCsrfToken = req.cookies.get('csrf-token')?.value;

    if (!csrfToken || csrfToken !== cookieCsrfToken) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'CSRF token validation failed',
        }),
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * API Key authentication middleware for LinkBay Core communication
 */
export function apiKeyMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.LINKBAY_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INVALID_API_KEY',
          message: 'Invalid or missing API key',
        }),
        { status: 401 }
      );
    }

    return handler(req);
  };
}

/**
 * Logging middleware for audit trail
 */
export function loggingMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const tenantId = extractTenantId(req.headers);

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      tenantId,
      userAgent: req.headers.get('user-agent'),
      ip,
    };

    console.log('[REQUEST]', JSON.stringify(logEntry));

    const response = await handler(req);
    const duration = Date.now() - startTime;

    console.log(
      '[RESPONSE]',
      JSON.stringify({
        ...logEntry,
        status: response.status,
        duration: `${duration}ms`,
      })
    );

    return response;
  };
}

/**
 * Compose multiple middlewares
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>>
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
