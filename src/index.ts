/**
 * Agni SDK Public API
 *
 * Users import everything
 * from this file.
 */

// Core

export { Agent } from './core/agent.js';

export { Runner } from './core/runner.js';

export { RunContext } from './core/run-context.js';

export type { RunResult } from './core/run-result.js';

export type {
  Message,
  ModelRequest,
  ModelResponse,
  ToolCall,
  ProviderToolDefinition,
} from './core/types.js';

export type { ToolDefinition } from './tools/tool.js';

// Providers

export * from './providers/gemini/gemini.provider.js';

export type { ModelProvider, ProviderInfo } from './providers/provider.interface.js';

// Tools

export type { Tool, ToolDefinition as SDKToolDefinition } from './tools/tool.js';

export { ToolRegistry } from './tools/tool-registry.js';

export { ToolExecutor } from './tools/tool-executor.js';

// Errors

export { AgniError } from './errors/agni-errors.js';
