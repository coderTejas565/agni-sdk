/**
 * Tool Executor for Agni SDK.
 *
 * Responsible for executing tools safely.
 *
 * Responsibilities:
 *
 * - Resolve tool from registry
 * - Execute tool logic
 * - Pass RunContext
 * - Normalize tool failures
 */

import type { RunContext } from '../core/run-context.js';

import type { Tool } from './tool.js';

import { ToolRegistry } from './tool-registry.js';

/**
 * Successful tool execution result.
 */
export interface ToolExecutionSuccess<TOutput> {
  success: true;

  output: TOutput;
}

/**
 * Failed tool execution result.
 */
export interface ToolExecutionFailure {
  success: false;

  error: Error;
}

/**
 * Combined tool execution result.
 */
export type ToolExecutionResult<TOutput> = ToolExecutionSuccess<TOutput> | ToolExecutionFailure;

export class ToolExecutor<TContext = unknown> {
  constructor(private readonly registry: ToolRegistry<TContext>) {}

  /**
   * Execute a tool by name.
   */
  async execute<TInput = unknown, TOutput = unknown>(
    name: string,

    input: TInput,

    context: RunContext<TContext>,
  ): Promise<ToolExecutionResult<TOutput>> {
    const tool = this.registry.get(name);

    if (!tool) {
      return {
        success: false,

        error: new Error(`Tool "${name}" not found.`),
      };
    }

    try {
      const output = (await this.runTool(tool, input, context)) as TOutput;

      return {
        success: true,

        output,
      };
    } catch (error) {
      return {
        success: false,

        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Internal tool execution.
   *
   * Keeps type casting isolated
   * in one place.
   */
  private async runTool<TInput, TOutput>(
    tool: Tool<TContext, TInput, TOutput>,

    input: TInput,

    context: RunContext<TContext>,
  ): Promise<TOutput> {
    return await tool.execute(input, context);
  }
}
