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
 * Events
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

import { EventBus } from '../streaming/event-bus.js';

import type { AgniEvent } from '../streaming/events.js';

import { ProviderError, ToolExecutionError } from '../errors/agni-errors.js';

export interface RunOptions<TContext> {
  context: TContext;
}

export class Runner<TContext = unknown> {
  private readonly toolRegistry: ToolRegistry<TContext>;

  private readonly toolExecutor: ToolExecutor<TContext>;

  private readonly eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? new EventBus();

    this.toolRegistry = new ToolRegistry<TContext>();

    this.toolExecutor = new ToolExecutor(this.toolRegistry);
  }

  /**
   * Access runtime events.
   */
  public get events(): EventBus {
    return this.eventBus;
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

    this.emit({
      type: 'agent.started',

      runId: context.runId,

      timestamp: Date.now(),

      agentName: agent.name,
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
      context.incrementTurn();

      this.emit({
        type: 'turn.started',

        runId: context.runId,

        timestamp: Date.now(),

        turn: context.turn,
      });

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
        this.emit({
          type: 'provider.request',

          runId: context.runId,

          timestamp: Date.now(),

          provider: agent.provider.info.name,

          model: agent.provider.info.model,
        });

        response = await agent.provider.generate({
          messages,

          tools: this.toolRegistry.getDefinitions(),

          providerOptions: agent.providerOptions,
        });

        this.emit({
          type: 'provider.response',

          runId: context.runId,

          timestamp: Date.now(),

          provider: agent.provider.info.name,

          model: agent.provider.info.model,
        });
      } catch (error) {
        const providerError =
          error instanceof ProviderError
            ? error
            : new ProviderError(error instanceof Error ? error.message : String(error));

        return {
          success: false,

          error: {
            type: 'provider_error',

            message: providerError.message,

            metadata: providerError.metadata,
          },

          metadata: {
            runId: context.runId,

            turns: context.turn,
          },
        };
      }

      if (response.type === 'text') {
        this.emit({
          type: 'agent.completed',

          runId: context.runId,

          timestamp: Date.now(),

          success: true,
        });

        return {
          success: true,

          output: response.content as TOutput,

          metadata: {
            runId: context.runId,

            turns: context.turn,
          },
        };
      }

      if (response.type === 'tool_call') {
        for (const call of response.toolCalls ?? []) {
          this.emit({
            type: 'tool.called',

            runId: context.runId,

            timestamp: Date.now(),

            toolName: call.name,

            arguments: call.arguments,
          });

          const result = await this.toolExecutor.execute(
            call.name,

            call.arguments,

            context,
          );

          this.emit({
            type: 'tool.completed',

            runId: context.runId,

            timestamp: Date.now(),

            toolName: call.name,

            success: result.success,
          });

          if (!result.success) {
            const toolError = new ToolExecutionError(result.error.message, {
              toolName: call.name,
            });

            return {
              success: false,

              error: {
                type: 'tool_error',

                message: toolError.message,

                metadata: toolError.metadata,
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

  private emit(event: AgniEvent): void {
    this.eventBus.emit(event);
  }
}
