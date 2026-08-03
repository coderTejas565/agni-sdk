/**
 * Agni SDK Public API
 *
 * Users import everything
 * from this file.
 */

// =====================
// Core
// =====================

export { Agent } from './core/agent.js';

export { Runner } from './core/runner.js';

export { RunContext } from './core/run-context.js';

export type { RunResult } from './core/run-result.js';

export type {
  Message,
  SystemMessage,
  UserMessage,
  AssistantMessage,
  ToolCallMessage,
  ToolResultMessage,
  ToolCall,
  ToolResult,
  ModelRequest,
  ModelResponse,
  TextResponse,
  ToolCallResponse,
  ProviderToolDefinition,
} from './core/types.js';

// =====================
// Providers
// =====================

export * from './providers/gemini/gemini.provider.js';

export type { ModelProvider, ProviderInfo } from './providers/provider.interface.js';

// =====================
// Tools
// =====================

export type { Tool, ToolDefinition } from './tools/tool.js';

export { ToolRegistry } from './tools/tool-registry.js';

export { ToolExecutor } from './tools/tool-executor.js';

// =====================
// Streaming
// =====================

export { EventBus } from './streaming/event-bus.js';

export type { AgniEvent, AgentEventType } from './streaming/events.js';

// =====================
// Errors
// =====================

export {
  AgniError,
  ProviderError,
  ToolExecutionError,
  ValidationError,
  GuardrailError,
  CancelledError,
} from './errors/agni-errors.js';
