/**
 * Agni SDK Error System.
 *
 * Base error classes used across
 * runtime, providers, tools, and validation.
 *
 * All SDK errors extend AgniError.
 */

/**
 * Base Agni SDK error.
 */
export class AgniError extends Error {
  /**
   * Error category.
   */
  public readonly code: string;

  /**
   * Additional error metadata.
   */
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,

    options?: {
      code?: string;

      metadata?: Record<string, unknown>;
    },
  ) {
    super(message);

    this.name = 'AgniError';

    this.code = options?.code ?? 'AGNI_ERROR';

    this.metadata = options?.metadata;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Provider communication failure.
 *
 * Examples:
 *
 * - API error
 * - Rate limit
 * - Authentication failure
 */
export class ProviderError extends AgniError {
  constructor(
    message: string,

    metadata?: Record<string, unknown>,
  ) {
    super(message, {
      code: 'PROVIDER_ERROR',

      metadata,
    });

    this.name = 'ProviderError';
  }
}

/**
 * Tool execution failure.
 *
 * Example:
 *
 * Weather API failed.
 */
export class ToolExecutionError extends AgniError {
  constructor(
    message: string,

    metadata?: Record<string, unknown>,
  ) {
    super(message, {
      code: 'TOOL_EXECUTION_ERROR',

      metadata,
    });

    this.name = 'ToolExecutionError';
  }
}

/**
 * Validation failure.
 *
 * Used for:
 *
 * - Invalid input
 * - Invalid tool arguments
 * - Schema mismatch
 */
export class ValidationError extends AgniError {
  constructor(
    message: string,

    metadata?: Record<string, unknown>,
  ) {
    super(
      message,

      {
        code: 'VALIDATION_ERROR',

        metadata,
      },
    );

    this.name = 'ValidationError';
  }
}

/**
 * Guardrail rejection.
 *
 * Example:
 *
 * PII blocked.
 */
export class GuardrailError extends AgniError {
  constructor(
    message: string,

    metadata?: Record<string, unknown>,
  ) {
    super(
      message,

      {
        code: 'GUARDRAIL_ERROR',

        metadata,
      },
    );

    this.name = 'GuardrailError';
  }
}

/**
 * Execution cancelled.
 */
export class CancelledError extends AgniError {
  constructor(
    message = 'Execution cancelled.',

    metadata?: Record<string, unknown>,
  ) {
    super(
      message,

      {
        code: 'CANCELLED',

        metadata,
      },
    );

    this.name = 'CancelledError';
  }
}
