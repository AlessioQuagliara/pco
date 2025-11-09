/**
 * Plugin Initialization for FastCheckOut
 * 
 * This file demonstrates how to register and initialize plugins
 * in your FastCheckOut instance.
 */

import { pluginManager } from '@/lib/plugin-manager';
import { examplePlugins } from '@/plugins/examples';

/**
 * Initialize all plugins
 * Call this function when your app starts
 */
export function initializePlugins() {
  console.log('[FastCheckout] Initializing plugins...');

  // Register all example plugins
  examplePlugins.forEach((plugin) => {
    pluginManager.register(plugin);
    console.log(`[FastCheckout] Registered plugin: ${plugin.name} v${plugin.version}`);
  });

  // You can also register plugins conditionally
  if (process.env.NODE_ENV === 'development') {
    // Development-only plugins
    console.log('[FastCheckout] Development mode - additional plugins loaded');
  }

  console.log(`[FastCheckout] ${pluginManager.getPlugins().length} plugins initialized`);
}

/**
 * Usage Example in your app:
 * 
 * // In your root layout or app initialization
 * import { initializePlugins } from '@/lib/init-plugins';
 * 
 * // Call during app startup
 * initializePlugins();
 */
