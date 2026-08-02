/**
 * Core shared types for Agni SDK.
 *
 * Provider-agnostic contracts used
 * throughout the Runtime.
 */

/* -------------------------------------------------------------------------- */
/*                                  Messages                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every conversation consists of
 * ordered Messages.
 */
export type Message =
  SystemMessage | UserMessage | AssistantMessage | ToolCallMessage | ToolResultMessage;

/**
 * System instructions.
 */
export interface SystemMessage {
  role: 'system';

  content: string;
}

/**
 * User input.
 */
export interface UserMessage {
  role: 'user';

  content: string;
}

/**
 * Normal assistant response.
 */
export interface AssistantMessage {
  role: 'assistant';

  content: string;
}

/**
 * Assistant requesting a tool.
 */
export interface ToolCallMessage {
  role: 'assistant';

  toolCall: ToolCall;
}

/**
 * Tool execution result.
 */
export interface ToolResultMessage {
  role: 'tool';

  toolResult: ToolResult;
}

/* -------------------------------------------------------------------------- */
/*                                   Tools                                    */
/* -------------------------------------------------------------------------- */

/**
 * Tool requested by the model.
 */
export interface ToolCall {
  /**
   * Provider generated id.
   */
  id?: string;

  /**
   * Tool name.
   */
  name: string;

  /**
   * Tool arguments.
   */
  arguments: Record<string, unknown>;
}

/**
 * Tool execution output.
 */
export interface ToolResult {
  /**
   * Matches ToolCall.id when provided.
   */
  toolCallId?: string;

  /**
   * Tool name.
   */
  name: string;

  /**
   * Serialized tool output.
   */
  output: unknown;
}

/* -------------------------------------------------------------------------- */
/*                              Provider Request                              */
/* -------------------------------------------------------------------------- */

/**
 * Runtime → Provider request.
 */
export interface ModelRequest {
  /**
   * Complete conversation history.
   */
  messages: Message[];

  /**
   * Available tools.
   */
  tools?: ProviderToolDefinition[];

  temperature?: number;

  maxTokens?: number;

  providerOptions?: Record<string, unknown>;
}

/**
 * Metadata exposed to providers.
 *
 * Runtime owns executable Tool objects.
 * Providers only receive metadata.
 */
export interface ProviderToolDefinition {
  name: string;

  description: string;

  parameters: unknown;
}

/* -------------------------------------------------------------------------- */
/*                             Provider Response                              */
/* -------------------------------------------------------------------------- */

/**
 * Provider → Runtime response.
 */
export type ModelResponse = TextResponse | ToolCallResponse;

/**
 * Normal model output.
 */
export interface TextResponse {
  type: 'text';

  content: string;
}

/**
 * Model requesting tool execution.
 */
export interface ToolCallResponse {
  type: 'tool_call';

  toolCalls: ToolCall[];
}

/* -------------------------------------------------------------------------- */
/*                               Utility Types                                */
/* -------------------------------------------------------------------------- */

/**
 * Generic async result.
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
