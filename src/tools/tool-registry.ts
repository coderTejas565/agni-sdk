/**
 * Tool Registry for Agni SDK.
 *
 * Responsible for:
 *
 * - Tool registration
 * - Tool lookup
 * - Provider metadata generation
 *
 * It does not execute tools.
 * Execution belongs to ToolExecutor.
 */

import type { Tool } from './tool.js';

import type { ProviderToolDefinition } from '../core/types.js';

export class ToolRegistry<TContext = unknown> {
  private readonly tools: Map<string, Tool<TContext, unknown, unknown>>;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool.
   */
  register(tool: Tool<TContext, unknown, unknown>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" already registered.`);
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * Remove a tool.
   */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Find tool by name.
   */
  get(name: string) {
    return this.tools.get(name);
  }

  /**
   * Check tool existence.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Return all tools.
   */
  list(): Tool<TContext, unknown, unknown>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Convert tools into provider format.
   */
  getDefinitions(): ProviderToolDefinition[] {
    return this.list().map((tool) => ({
      name: tool.name,

      description: tool.description,

      parameters: tool.parameters,
    }));
  }
}
