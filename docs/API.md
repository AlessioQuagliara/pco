# FastCheckOut API Documentation

## Authentication

All API requests require the `X-Tenant-ID` header to identify the tenant.

```
X-Tenant-ID: {tenant-uuid}
```

For internal API calls from LinkBay Core, also include:
```
X-API-Key: {your-api-key}
```

## Payment APIs

### Create Stripe Payment Intent

Creates a payment intent for processing card payments via Stripe.

**Endpoint:** `POST /api/stripe/payment-intent`

**Headers:**
- `X-Tenant-ID`: Tenant UUID (required)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "EUR",
  "metadata": {
    "sessionId": "session-123",
    "customField": "value"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  },
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "STRIPE_NOT_ENABLED",
    "message": "Stripe is not enabled for this tenant"
  },
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

---

### Create PayPal Order

Creates an order for PayPal payment processing.

**Endpoint:** `POST /api/paypal/create-order`

**Headers:**
- `X-Tenant-ID`: Tenant UUID (required)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "EUR",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "5O190127TN364715T"
  },
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

---

### Capture PayPal Order

Captures a previously created PayPal order.

**Endpoint:** `POST /api/paypal/capture-order`

**Headers:**
- `X-Tenant-ID`: Tenant UUID (required)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "orderId": "5O190127TN364715T",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "2GG279541U471931P",
    "status": "COMPLETED"
  },
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

## Analytics APIs

### Get Checkout Analytics

Retrieves checkout performance metrics for a tenant within a date range.

**Endpoint:** `GET /api/analytics/checkout`

**Headers:**
- `X-Tenant-ID`: Tenant UUID (required)

**Query Parameters:**
- `startDate`: ISO 8601 date string (required)
- `endDate`: ISO 8601 date string (required)

**Example Request:**
```
GET /api/analytics/checkout?startDate=2024-11-01T00:00:00Z&endDate=2024-11-09T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 1250,
    "completedCheckouts": 987,
    "conversionRate": 0.789,
    "averageCompletionTime": 142.5,
    "abandonmentRate": 0.211,
    "abandonmentByStep": {
      "cart": 45,
      "shipping": 78,
      "payment": 140
    },
    "paymentErrorBreakdown": {
      "card_declined": 23,
      "insufficient_funds": 12,
      "expired_card": 8
    },
    "revenueByPaymentMethod": {
      "stripe": 45000.00,
      "paypal": 32000.00
    },
    "totalRevenue": 77000.00
  },
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

## Webhook APIs

### Stripe Webhook

Receives webhook events from Stripe.

**Endpoint:** `POST /api/stripe/webhook`

**Headers:**
- `stripe-signature`: Stripe signature for verification (required)

**Event Types Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## Health Check

### Get Service Health

Returns the health status of the FastCheckOut service.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-09T10:30:00.000Z",
    "uptime": 86400,
    "environment": "production",
    "services": {
      "linkbay": "configured",
      "stripe": "configured",
      "paypal": "configured"
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_TENANT_ID` | X-Tenant-ID header is missing |
| `INVALID_TENANT_ID` | X-Tenant-ID is not a valid UUID |
| `STRIPE_NOT_ENABLED` | Stripe is not configured for this tenant |
| `PAYPAL_NOT_ENABLED` | PayPal is not configured for this tenant |
| `RATE_LIMIT_EXCEEDED` | Too many requests (max 100/15min) |
| `CSRF_VALIDATION_FAILED` | CSRF token is invalid |
| `INVALID_API_KEY` | API key is missing or invalid |
| `STRIPE_ERROR` | Error from Stripe API |
| `PAYPAL_ERROR` | Error from PayPal API |
| `WEBHOOK_ERROR` | Webhook signature validation failed |
| `ANALYTICS_ERROR` | Error fetching analytics data |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

All endpoints are rate-limited to **100 requests per 15 minutes** per tenant.

When rate limit is exceeded:

**Status Code:** `429 Too Many Requests`

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

**Headers:**
```
Retry-After: 300
```

## Best Practices

1. **Always handle errors gracefully** - Check the `success` field before accessing `data`
2. **Use idempotency** - Include unique `sessionId` in metadata for deduplication
3. **Implement retry logic** - Use exponential backoff for failed requests
4. **Validate responses** - Don't assume fields are always present
5. **Monitor rate limits** - Track your API usage to avoid hitting limits
6. **Keep API keys secure** - Never expose keys in client-side code
