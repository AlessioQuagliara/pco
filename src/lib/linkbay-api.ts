/**
 * LinkBay Core API Client
 * Handles communication with the main LinkBay CMS platform
 */

import type { Tenant, Order, WebhookEvent } from '@/types';
import { retryWithBackoff } from './utils';

const LINKBAY_API_URL = process.env.LINKBAY_API_URL || 'https://api.linkbay.com';
const LINKBAY_API_KEY = process.env.LINKBAY_API_KEY || '';

interface LinkBayApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class LinkBayApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await retryWithBackoff(async () => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
      });
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `LinkBay API Error: ${response.status} - ${error.message || response.statusText}`
      );
    }

    const result = await response.json() as LinkBayApiResponse<T>;
    
    if (!result.success) {
      throw new Error(
        `LinkBay API Error: ${result.error?.code} - ${result.error?.message}`
      );
    }

    return result.data as T;
  }

  /**
   * Get tenant configuration by ID
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    return this.request<Tenant>(`/tenants/${tenantId}`, {
      method: 'GET',
    });
  }

  /**
   * Create order in LinkBay CMS
   */
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Send webhook event to LinkBay Core
   */
  async sendWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    await this.request('/webhooks/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Get product details by ID (for cart validation)
   */
  async getProduct(tenantId: string, productId: string): Promise<{
    id: string;
    name: string;
    price: number;
    available: boolean;
  }> {
    return this.request(`/tenants/${tenantId}/products/${productId}`, {
      method: 'GET',
    });
  }

  /**
   * Validate cart items against current prices and availability
   */
  async validateCart(
    tenantId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    valid: boolean;
    errors?: string[];
    updatedItems?: Array<{ productId: string; currentPrice: number; available: boolean }>;
  }> {
    return this.request(`/tenants/${tenantId}/cart/validate`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  /**
   * Record checkout metrics
   */
  async recordMetrics(
    tenantId: string,
    metrics: {
      sessionId: string;
      event: 'started' | 'completed' | 'abandoned' | 'payment_failed';
      duration?: number;
      step?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.request(`/tenants/${tenantId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metrics),
    });
  }

  /**
   * Get checkout analytics for dashboard
   */
  async getCheckoutAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSessions: number;
    completedCheckouts: number;
    conversionRate: number;
    averageCompletionTime: number;
    abandonmentRate: number;
    revenueByPaymentMethod: Record<string, number>;
  }> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return this.request(`/tenants/${tenantId}/analytics/checkout?${params}`, {
      method: 'GET',
    });
  }
}

// Singleton instance
export const linkBayApi = new LinkBayApiClient(LINKBAY_API_URL, LINKBAY_API_KEY);

// Export for testing/mocking
export { LinkBayApiClient };
