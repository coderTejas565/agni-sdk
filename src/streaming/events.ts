/**
 * Agni SDK Runtime Events.
 *
 * Events represent important lifecycle
 * moments during Agent execution.
 *
 * Runtime publishes events.
 * Users can subscribe to them.
 */

/**
 * Base event structure.
 *
 * Every event contains:
 *
 * - event type
 * - execution id
 * - timestamp
 */
export interface BaseEvent {
  /**
   * Event identifier.
   */
  type: AgentEventType;

  /**
   * Current execution id.
   */
  runId: string;

  /**
   * Event creation time.
   */
  timestamp: number;
}

/**
 * Agent execution started.
 */
export interface AgentStartedEvent extends BaseEvent {
  type: 'agent.started';

  agentName: string;
}

/**
 * Agent execution completed.
 */
export interface AgentCompletedEvent extends BaseEvent {
  type: 'agent.completed';

  success: boolean;
}

/**
 * New execution turn started.
 */
export interface TurnStartedEvent extends BaseEvent {
  type: 'turn.started';

  turn: number;
}

/**
 * Tool execution started.
 */
export interface ToolCalledEvent extends BaseEvent {
  type: 'tool.called';

  toolName: string;

  arguments: Record<string, unknown>;
}

/**
 * Tool execution completed.
 */
export interface ToolCompletedEvent extends BaseEvent {
  type: 'tool.completed';

  toolName: string;

  success: boolean;

  durationMs?: number;
}

/**
 * Provider request started.
 */
export interface ProviderRequestEvent extends BaseEvent {
  type: 'provider.request';

  provider: string;

  model: string;
}

/**
 * Provider response received.
 */
export interface ProviderResponseEvent extends BaseEvent {
  type: 'provider.response';

  provider: string;

  model: string;
}

/**
 * Union of all runtime events.
 *
 * EventBus uses this type.
 */
export type AgniEvent =
  | AgentStartedEvent
  | AgentCompletedEvent
  | TurnStartedEvent
  | ToolCalledEvent
  | ToolCompletedEvent
  | ProviderRequestEvent
  | ProviderResponseEvent;

/**
 * Supported event names.
 */
export type AgentEventType =
  | 'agent.started'
  | 'agent.completed'
  | 'turn.started'
  | 'tool.called'
  | 'tool.completed'
  | 'provider.request'
  | 'provider.response';
