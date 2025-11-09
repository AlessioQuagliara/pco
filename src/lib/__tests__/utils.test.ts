import { formatCurrency, calculateCartTotals, generateOrderNumber, sanitizeInput } from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56, 'EUR', 'it-IT')).toBe('1.234,56 €');
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
    });

    it('should handle zero values', () => {
      expect(formatCurrency(0, 'EUR')).toBe('0,00 €');
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate totals correctly', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 15, quantity: 1 },
      ];

      const result = calculateCartTotals(items, 0.22, 5);

      expect(result.subtotal).toBe(35);
      expect(result.tax).toBe(7.7);
      expect(result.shipping).toBe(5);
      expect(result.total).toBe(47.7);
    });

    it('should handle empty cart', () => {
      const result = calculateCartTotals([], 0.22, 5);

      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(5); // Only shipping
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate unique order numbers', () => {
      const order1 = generateOrderNumber('tenant-123');
      const order2 = generateOrderNumber('tenant-123');

      expect(order1).not.toBe(order2);
      expect(order1).toContain('TENA'); // First 4 chars of tenant ID uppercase
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should handle normal text', () => {
      const normal = 'Hello World';
      expect(sanitizeInput(normal)).toBe('Hello World');
    });
  });
});
