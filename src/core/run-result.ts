/**
 * Run result types for Agni SDK.
 *
 * Represents the outcome of an Agent execution.
 *
 * Expected execution failures are returned here.
 * Unexpected system failures should throw.
 */

/**
 * Successful Agent execution result.
 */
export interface RunSuccess<TOutput> {
  success: true;

  /**
   * Final Agent output.
   */
  output: TOutput;

  /**
   * Optional execution metadata.
   */
  metadata?: RunMetadata;
}

/**
 * Failed Agent execution result.
 *
 * These are expected runtime failures.
 *
 * Examples:
 * - Tool failure
 * - Provider failure
 * - Guardrail rejection
 * - Max turns exceeded
 */
export interface RunFailure {
  success: false;

  error: RunError;

  metadata?: RunMetadata;
}

/**
 * Combined result returned by run().
 */
export type RunResult<TOutput> = RunSuccess<TOutput> | RunFailure;

/**
 * Runtime execution metadata.
 *
 * Useful for debugging,
 * tracing, and observability.
 */
export interface RunMetadata {
  /**
   * Unique execution identifier.
   */
  runId?: string;

  /**
   * Number of model/tool cycles.
   */
  turns?: number;

  /**
   * Execution duration.
   */
  durationMs?: number;
}

/**
 * Structured runtime error.
 *
 * Expected failures only.
 */
export interface RunError {
  /**
   * Error category.
   */
  type: RunErrorType;

  /**
   * Human readable message.
   */
  message: string;

  /**
   * Additional information.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Known execution error types.
 */
export type RunErrorType =
  | 'provider_error'
  | 'tool_error'
  | 'validation_error'
  | 'guardrail_blocked'
  | 'max_turns_exceeded'
  | 'cancelled';
