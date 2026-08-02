/**
 * Run Context for Agni SDK.
 *
 * Stores request-scoped data available
 * during a single Agent execution.
 *
 * Context is NOT part of the conversation.
 * It is runtime-only data.
 */

/**
 * Generic execution context.
 *
 * TContext is defined by the application.
 *
 * Example:
 *
 * interface AppContext {
 *   userId: string;
 *   tenantId: string;
 * }
 *
 * RunContext<AppContext>
 */
export class RunContext<TContext = unknown> {
  /**
   * User/application provided data.
   */
  public readonly context: TContext;

  /**
   * Unique execution identifier.
   */
  public readonly runId: string;

  /**
   * Current execution turn.
   */
  private _turn: number;

  constructor(options: {
    context: TContext;

    runId: string;
  }) {
    this.context = options.context;

    this.runId = options.runId;

    this._turn = 0;
  }

  /**
   * Current Agent execution turn.
   */
  get turn(): number {
    return this._turn;
  }

  /**
   * Increment execution turn.
   *
   * Called by Runtime after every
   * provider/tool cycle.
   */
  incrementTurn(): void {
    this._turn += 1;
  }

  /**
   * Create child context.
   *
   * Useful for future features:
   * - Handoffs
   * - Nested agents
   * - Parallel execution
   */
  clone(overrides?: Partial<TContext>): RunContext<TContext> {
    const nextContext = {
      ...this.context,

      ...overrides,
    } as TContext;

    return new RunContext({
      context: nextContext,

      runId: this.runId,
    });
  }
}
