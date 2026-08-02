/**
 * Runtime execution limits.
 *
 * Controls Agent execution boundaries.
 */

export interface RunLimits {
  /**
   * Maximum provider/tool cycles.
   */
  maxTurns?: number;

  /**
   * Maximum execution time.
   */
  timeoutMs?: number;
}
