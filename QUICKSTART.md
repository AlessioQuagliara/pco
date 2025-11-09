# FastCheckOut - Quick Setup Guide

## Development Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:
```env
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Sandbox (get from https://developer.paypal.com/)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_MODE=sandbox

# LinkBay Core (for production)
LINKBAY_API_URL=https://api.linkbay.com
LINKBAY_API_KEY=your_api_key
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000/checkout

## Testing Payments

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### PayPal Sandbox
Login with your sandbox buyer account from PayPal Developer Dashboard.

## Docker Deployment

### Quick Start
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Custom Build
```bash
# Build image
docker build -t fastcheckout:1.0.0 .

# Run container
docker run -p 3000:3000 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e LINKBAY_API_KEY=... \
  fastcheckout:1.0.0
```

## Production Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### AWS ECS / Other
1. Build Docker image
2. Push to container registry
3. Configure environment variables
4. Deploy with your orchestrator

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests (requires running dev server)
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Plugin Development

Create a new plugin in `src/plugins/`:

```typescript
import type { Plugin } from '@/types';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async beforePayment(ctx) {
    // Your logic here
    return ctx;
  },
};
```

Register in your app:
```typescript
import { pluginManager } from '@/lib/plugin-manager';
import { myPlugin } from './plugins/my-plugin';

pluginManager.register(myPlugin);
```

## Webhooks Setup

### Stripe
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### PayPal
PayPal webhooks are handled automatically via the SDK.

## Troubleshooting

### "Stripe is not enabled"
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify tenant configuration includes Stripe config

### "PayPal order creation failed"
- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Check `PAYPAL_MODE` is set to 'sandbox' for testing

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@fastcheckout.dev

---

**Ready to go!** 🚀
