/**
 * Agent definition for Agni SDK.
 *
 * Agent represents reusable execution configuration.
 *
 * It stores:
 *
 * - Instructions
 * - Provider
 * - Tools
 * - Runtime limits
 *
 * Agent does not execute anything.
 * Runner owns execution.
 */

import type { Tool } from '../tools/tool.js';

import type { RunLimits } from './limits.js';

import type { ModelProvider } from '../providers/provider.interface.js';

/**
 * Agent configuration.
 */
export interface AgentConfig<TContext = unknown> {
  /**
   * Agent name.
   */
  name: string;

  /**
   * System instructions.
   */
  instructions?: string;

  /**
   * Model provider.
   */
  provider: ModelProvider;

  /**
   * Registered tools.
   */
  tools?: Tool<TContext, unknown, unknown>[];

  /**
   * Execution limits.
   */
  limits?: RunLimits;

  /**
   * Provider specific options.
   */
  providerOptions?: Record<string, unknown>;
}

/**
 * Agent class.
 *
 * Immutable execution definition.
 */
export class Agent<TContext = unknown> {
  public readonly name: string;

  public readonly instructions?: string;

  public readonly provider: ModelProvider;

  public readonly tools: readonly Tool<TContext, unknown, unknown>[];

  public readonly limits?: RunLimits;

  public readonly providerOptions: Readonly<Record<string, unknown>>;

  constructor(config: AgentConfig<TContext>) {
    this.name = config.name;

    this.instructions = config.instructions;

    this.provider = config.provider;

    this.tools = config.tools ?? [];

    this.limits = config.limits;

    this.providerOptions = config.providerOptions ?? {};
  }

  /**
   * Creates a new Agent with overrides.
   */
  clone(overrides: Partial<AgentConfig<TContext>>): Agent<TContext> {
    return new Agent({
      name: overrides.name ?? this.name,

      instructions: overrides.instructions ?? this.instructions,

      provider: overrides.provider ?? this.provider,

      tools: overrides.tools ?? [...this.tools],

      limits: overrides.limits ?? this.limits,

      providerOptions: overrides.providerOptions ?? this.providerOptions,
    });
  }
}
