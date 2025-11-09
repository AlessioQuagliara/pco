import type { Plugin, PluginContext } from '@/types';

/**
 * Plugin Manager for FastCheckOut
 * Dynamically loads and executes plugins based on lifecycle hooks
 */
class PluginManager {
  private plugins: Plugin[] = [];

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    console.log(`[PluginManager] Registering plugin: ${plugin.name} v${plugin.version}`);
    this.plugins.push(plugin);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== pluginName);
    console.log(`[PluginManager] Unregistered plugin: ${pluginName}`);
  }

  /**
   * Execute beforeCheckoutInit hooks
   */
  async executeBeforeCheckoutInit(context: PluginContext): Promise<PluginContext> {
    let ctx = { ...context };

    for (const plugin of this.plugins) {
      if (plugin.beforeCheckoutInit) {
        try {
          ctx = await plugin.beforeCheckoutInit(ctx);
          console.log(`[PluginManager] Executed beforeCheckoutInit for ${plugin.name}`);
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.beforeCheckoutInit:`, error);
        }
      }
    }

    return ctx;
  }

  /**
   * Execute beforePayment hooks
   */
  async executeBeforePayment(context: PluginContext): Promise<PluginContext> {
    let ctx = { ...context };

    for (const plugin of this.plugins) {
      if (plugin.beforePayment) {
        try {
          ctx = await plugin.beforePayment(ctx);
          console.log(`[PluginManager] Executed beforePayment for ${plugin.name}`);
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.beforePayment:`, error);
        }
      }
    }

    return ctx;
  }

  /**
   * Execute afterPaymentSuccess hooks
   */
  async executeAfterPaymentSuccess(context: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.afterPaymentSuccess) {
        try {
          await plugin.afterPaymentSuccess(context);
          console.log(`[PluginManager] Executed afterPaymentSuccess for ${plugin.name}`);
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.afterPaymentSuccess:`, error);
        }
      }
    }
  }

  /**
   * Execute afterPaymentFailure hooks
   */
  async executeAfterPaymentFailure(context: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.afterPaymentFailure) {
        try {
          await plugin.afterPaymentFailure(context);
          console.log(`[PluginManager] Executed afterPaymentFailure for ${plugin.name}`);
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.afterPaymentFailure:`, error);
        }
      }
    }
  }

  /**
   * Execute onValidation hooks
   */
  async executeOnValidation(context: PluginContext): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const plugin of this.plugins) {
      if (plugin.onValidation) {
        try {
          const result = await plugin.onValidation(context);
          if (!result.valid && result.errors) {
            errors.push(...result.errors);
          }
          console.log(`[PluginManager] Executed onValidation for ${plugin.name}`);
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.onValidation:`, error);
          errors.push(`Plugin ${plugin.name} validation failed`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get list of registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

// Export for testing
export { PluginManager };
