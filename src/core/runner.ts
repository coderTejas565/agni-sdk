/**
 * Runner for Agni SDK.
 *
 * Responsible for executing an Agent.
 *
 * Flow:
 *
 * Agent
 *  |
 * RunContext
 *  |
 * Provider
 *  |
 * Tool Execution
 *  |
 * Final Result
 */

import type { Agent } from './agent.js';

import { RunContext } from './run-context.js';

import type { RunResult } from './run-result.js';

import type { Message } from './types.js';

import { ToolRegistry } from '../tools/tool-registry.js';

import { ToolExecutor } from '../tools/tool-executor.js';

import { createId } from '../utils/id.js';

export interface RunOptions<TContext> {
  context: TContext;
}

export class Runner<TContext = unknown> {
  private readonly toolRegistry: ToolRegistry<TContext>;

  private readonly toolExecutor: ToolExecutor<TContext>;

  constructor() {
    this.toolRegistry = new ToolRegistry<TContext>();

    this.toolExecutor = new ToolExecutor(this.toolRegistry);
  }

  async run<TOutput = string>(
    agent: Agent<TContext>,

    input: string,

    options: RunOptions<TContext>,
  ): Promise<RunResult<TOutput>> {
    const context = new RunContext<TContext>({
      context: options.context,

      runId: createId(),
    });

    for (const tool of agent.tools) {
      if (!this.toolRegistry.has(tool.name)) {
        this.toolRegistry.register(tool);
      }
    }

    const messages: Message[] = [
      ...(agent.instructions
        ? [
            {
              role: 'system' as const,

              content: agent.instructions,
            },
          ]
        : []),

      {
        role: 'user' as const,

        content: input,
      },
    ];

    while (true) {
      /**
       * Increment execution cycle.
       */
      context.incrementTurn();

      /**
       * Check execution limit.
       */
      if (agent.limits?.maxTurns && context.turn > agent.limits.maxTurns) {
        return {
          success: false,

          error: {
            type: 'max_turns_exceeded',

            message: 'Maximum agent turns exceeded.',
          },

          metadata: {
            runId: context.runId,

            turns: context.turn,
          },
        };
      }

      let response;

      try {
        response = await agent.provider.generate({
          messages,

          tools: this.toolRegistry.getDefinitions(),

          providerOptions: agent.providerOptions,
        });
      } catch (error) {
        return {
          success: false,

          error: {
            type: 'provider_error',

            message: error instanceof Error ? error.message : String(error),
          },

          metadata: {
            runId: context.runId,

            turns: context.turn,
          },
        };
      }

      /**
       * Final text response.
       */
      if (response.type === 'text') {
        return {
          success: true,

          output: response.content as TOutput,

          metadata: {
            runId: context.runId,

            turns: context.turn,
          },
        };
      }

      /**
       * Tool execution flow.
       */
      if (response.type === 'tool_call') {
        for (const call of response.toolCalls ?? []) {
          const result = await this.toolExecutor.execute(
            call.name,

            call.arguments,

            context,
          );

          if (!result.success) {
            return {
              success: false,

              error: {
                type: 'tool_error',

                message: result.error.message,
              },

              metadata: {
                runId: context.runId,

                turns: context.turn,
              },
            };
          }

          messages.push({
            role: 'tool',

            toolResult: {
              toolCallId: call.id,

              name: call.name,

              output: result.output,
            },
          });
        }
      }
    }
  }
}
