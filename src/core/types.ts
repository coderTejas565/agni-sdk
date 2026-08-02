/**
 * Core shared types for Agni SDK.
 *
 * This file contains provider-agnostic
 * contracts used across the SDK.
 */

/**
 * Represents a message exchanged
 * between user, model, and tools.
 */
export interface Message {
  readonly role: MessageRole;

  readonly content: string | MessageContent[];
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface MessageContent {
  type: 'text';

  text: string;
}

/**
 * Represents a request sent
 * to a model provider.
 */
export interface ModelRequest {
  messages: Message[];

  /**
   * Tools available for this request.
   *
   * Provider adapters convert
   * these into provider-specific
   * tool formats.
   */
  tools?: ProviderToolDefinition[];

  temperature?: number;

  maxTokens?: number;

  providerOptions?: Record<string, unknown>;
}

/**
 * Provider-facing tool metadata.
 *
 * This is intentionally different
 * from the executable Tool contract.
 *
 * Runtime tools live in:
 *
 * src/tools/tool.ts
 *
 * Providers only need metadata.
 */
export interface ProviderToolDefinition {
  name: string;

  description: string;

  parameters: unknown;
}

/**
 * Normalized response returned
 * from any provider.
 *
 * Runtime never understands:
 *
 * Gemini Candidate
 * OpenAI Choice
 * Anthropic ContentBlock
 */
export interface ModelResponse {
  type: 'text' | 'tool_call';

  content?: string;

  toolCalls?: ToolCall[];
}

/**
 * Represents a model requested
 * tool execution.
 */
export interface ToolCall {
  id?: string;

  name: string;

  arguments: Record<string, unknown>;
}

/**
 * Generic async result.
 *
 * Used where failure is expected
 * and should be handled explicitly.
 */
export type AsyncResult<T> = Promise<
  | {
      success: true;

      value: T;
    }
  | {
      success: false;

      error: Error;
    }
>;
