/**
 * Tool Guardrail System.
 *
 * Validates tool execution
 * before and after execution.
 */

import type { RunContext } from '../core/run-context.js';

export interface ToolGuardrailResult {
  allowed: boolean;

  reason?: string;
}

export interface ToolGuardrail<TContext = unknown> {
  name: string;

  /**
   * Runs before tool execution.
   */
  beforeExecute?(
    toolName: string,

    input: unknown,

    context: RunContext<TContext>,
  ): ToolGuardrailResult | Promise<ToolGuardrailResult>;

  /**
   * Runs after tool execution.
   */
  afterExecute?(
    toolName: string,

    output: unknown,

    context: RunContext<TContext>,
  ): ToolGuardrailResult | Promise<ToolGuardrailResult>;
}
