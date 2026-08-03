/**
 * Event Bus for Agni SDK.
 *
 * Responsible for:
 *
 * - Publishing runtime events
 * - Subscribing listeners
 * - Removing listeners
 *
 * Runtime components emit events.
 * Users consume events.
 */

import type { AgniEvent, AgentEventType } from './events.js';

/**
 * Listener function.
 */
export type EventListener<TEvent extends AgniEvent = AgniEvent> = (event: TEvent) => void;

export class EventBus {
  private readonly listeners: Map<AgentEventType, Set<EventListener>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   *
   * Example:
   *
   * bus.on(
   *   "tool.called",
   *   event => {
   *     console.log(event.toolName)
   *   }
   * )
   */
  on<T extends AgniEvent>(
    type: T['type'],

    listener: EventListener<T>,
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(listener as EventListener);

    /**
     * Return unsubscribe function.
     */
    return () => {
      this.off(type, listener);
    };
  }

  /**
   * Remove listener.
   */
  off<T extends AgniEvent>(
    type: T['type'],

    listener: EventListener<T>,
  ): void {
    const handlers = this.listeners.get(type);

    if (!handlers) {
      return;
    }

    handlers.delete(listener as EventListener);

    if (handlers.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * Publish event.
   */
  emit<T extends AgniEvent>(event: T): void {
    const handlers = this.listeners.get(event.type);

    if (!handlers) {
      return;
    }

    for (const listener of handlers) {
      try {
        listener(event);
      } catch (error) {
        /**
         * Listener failures
         * should not break
         * Agent execution.
         */
        console.error('Agni event listener error:', error);
      }
    }
  }

  /**
   * Remove all listeners.
   */
  clear(): void {
    this.listeners.clear();
  }
}
