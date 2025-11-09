# Integrazione FastCheckOut con LinkBay CMS

Questa guida mostra come integrare FastCheckOut nel tuo sistema LinkBay.

## Architettura

```
┌─────────────────┐         ┌──────────────────┐
│   LinkBay CMS   │◄────────┤  FastCheckOut    │
│   (Main App)    │  API    │  (Microservice)  │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
   PostgreSQL                   Redis/Cache
```

## 1. Configurazione Tenant

Quando un nuovo cliente viene creato in LinkBay, registra le sue configurazioni per FastCheckOut:

```typescript
// LinkBay Backend - Tenant Service
import { linkBayApi } from '@/lib/linkbay-api';

async function createTenant(tenantData: {
  name: string;
  email: string;
  // ... altri campi
}) {
  // 1. Crea tenant in LinkBay
  const tenant = await db.tenant.create({ data: tenantData });

  // 2. Configura FastCheckOut per il tenant
  await configureFastCheckout(tenant.id, {
    enabledPaymentMethods: ['stripe', 'paypal'],
    currency: 'EUR',
    taxRate: 0.22,
    stripeConfig: {
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: true,
    },
    paypalConfig: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: 'sandbox',
      enabled: true,
    },
    branding: {
      logo: tenant.logo,
      brandColor: tenant.primaryColor,
    },
  });

  return tenant;
}
```

## 2. Embedding FastCheckOut

### Opzione A: iFrame Integration

Incorpora FastCheckOut come iframe nel tuo sito:

```html
<!-- Nel tuo sito LinkBay -->
<iframe
  src="https://checkout.yourdomain.com/checkout?tenant={TENANT_ID}"
  width="100%"
  height="800px"
  frameborder="0"
  allow="payment"
></iframe>
```

### Opzione B: Redirect Flow

Reindirizza l'utente a FastCheckOut:

```typescript
// Nel tuo frontend LinkBay
function redirectToCheckout(cart: Cart) {
  const checkoutUrl = new URL('https://checkout.yourdomain.com/checkout');
  checkoutUrl.searchParams.set('tenant', TENANT_ID);
  
  // Salva cart in session o passa via URL (secure)
  window.location.href = checkoutUrl.toString();
}
```

### Opzione C: SDK Integration (Recommended)

Usa il SDK JavaScript di FastCheckOut:

```html
<script src="https://checkout.yourdomain.com/sdk.js"></script>
<script>
  FastCheckout.init({
    tenantId: 'YOUR_TENANT_ID',
    container: '#checkout-container',
    onSuccess: (order) => {
      console.log('Order completed:', order);
      // Reindirizza a pagina conferma
    },
    onError: (error) => {
      console.error('Checkout error:', error);
    }
  });
</script>

<div id="checkout-container"></div>
```

## 3. Gestione Cart

Sincronizza il carrello tra LinkBay e FastCheckOut:

```typescript
// API endpoint in LinkBay per validare cart
app.post('/api/cart/validate', async (req, res) => {
  const { items, tenantId } = req.body;

  // Valida con FastCheckout
  const validation = await fetch(`${FASTCHECKOUT_URL}/api/validate-cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify({ items }),
  });

  const result = await validation.json();
  res.json(result);
});
```

## 4. Webhook Handling

Ricevi notifiche da FastCheckOut quando un ordine è completato:

```typescript
// LinkBay Backend - Webhook Handler
app.post('/webhooks/fastcheckout', async (req, res) => {
  const event = req.body;

  // Verifica signature (importante!)
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  switch (event.type) {
    case 'checkout.completed':
      await handleCheckoutCompleted(event.data);
      break;
    
    case 'payment.succeeded':
      await handlePaymentSucceeded(event.data);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;
    
    case 'order.created':
      await handleOrderCreated(event.data);
      break;
  }

  res.json({ received: true });
});

async function handleOrderCreated(orderData: Order) {
  // 1. Salva ordine nel database LinkBay
  const order = await db.order.create({
    data: {
      tenantId: orderData.tenantId,
      orderNumber: orderData.orderNumber,
      total: orderData.cart.total,
      status: 'confirmed',
      // ... altri campi
    },
  });

  // 2. Aggiorna inventario
  await updateInventory(orderData.cart.items);

  // 3. Invia email conferma
  await sendOrderConfirmationEmail(order);

  // 4. Notifica il merchant
  await notifyMerchant(order);
}
```

## 5. Analytics Integration

Recupera metriche da FastCheckOut per la dashboard LinkBay:

```typescript
// Dashboard Component
async function getCheckoutMetrics(tenantId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  const response = await fetch(
    `${FASTCHECKOUT_URL}/api/analytics/checkout?` +
    `startDate=${startDate.toISOString()}&` +
    `endDate=${endDate.toISOString()}`,
    {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    }
  );

  const { data } = await response.json();
  return data;
}

// Visualizza in dashboard
function CheckoutDashboard() {
  const metrics = await getCheckoutMetrics(currentTenantId);

  return (
    <div>
      <MetricCard title="Conversion Rate" value={`${(metrics.conversionRate * 100).toFixed(1)}%`} />
      <MetricCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} />
      <MetricCard title="Avg. Completion" value={`${metrics.averageCompletionTime}s`} />
      {/* ... */}
    </div>
  );
}
```

## 6. Custom Branding

Personalizza l'aspetto di FastCheckOut per ogni tenant:

```typescript
// API per aggiornare branding
app.put('/api/tenants/:id/checkout-branding', async (req, res) => {
  const { id } = req.params;
  const { logo, brandColor, customCss } = req.body;

  // Aggiorna configurazione FastCheckout
  await updateTenantConfig(id, {
    branding: {
      logo,
      brandColor,
      customCss,
    },
  });

  res.json({ success: true });
});
```

Applica CSS custom:

```css
/* Custom CSS per tenant specifico */
:root {
  --primary-color: {{ tenant.brandColor }};
  --logo-url: url('{{ tenant.logo }}');
}

.checkout-header {
  background-color: var(--primary-color);
}

.checkout-logo {
  content: var(--logo-url);
}
```

## 7. Multi-Currency Support

Gestisci valute multiple per tenant internazionali:

```typescript
async function initCheckoutWithCurrency(tenantId: string, currency: string) {
  const session = await createCheckoutSession({
    tenantId,
    cart: {
      items: [...],
      currency, // EUR, USD, GBP, etc.
    },
  });

  return session;
}
```

## 8. Testing Integration

Test end-to-end dell'integrazione:

```typescript
// Test di integrazione
describe('LinkBay <> FastCheckout Integration', () => {
  it('should create order in LinkBay after successful checkout', async () => {
    // 1. Create cart in LinkBay
    const cart = await linkBay.createCart({ items: [...] });

    // 2. Complete checkout in FastCheckout
    const order = await fastCheckout.processCheckout({
      tenantId: TENANT_ID,
      cart,
      shippingAddress: testAddress,
      paymentMethod: 'stripe',
    });

    // 3. Verify order created in LinkBay
    const linkBayOrder = await linkBay.getOrder(order.id);
    expect(linkBayOrder.status).toBe('confirmed');
  });
});
```

## Best Practices

1. **Security**: Always verify webhook signatures
2. **Idempotency**: Use session IDs to prevent duplicate orders
3. **Error Handling**: Implement retry logic for failed webhook deliveries
4. **Monitoring**: Track checkout funnel metrics
5. **Caching**: Cache tenant configurations for performance
6. **Rate Limiting**: Respect API rate limits (100 req/15min)

## Troubleshooting

### Webhook not received
- Check firewall allows FastCheckout IPs
- Verify webhook URL is publicly accessible
- Check webhook secret is correct

### Orders not syncing
- Verify tenant ID matches between systems
- Check API key permissions
- Review error logs in both systems

## Support

For integration support:
- Technical Docs: https://docs.fastcheckout.dev
- Support Email: support@fastcheckout.dev
- Slack Community: #fastcheckout-support
