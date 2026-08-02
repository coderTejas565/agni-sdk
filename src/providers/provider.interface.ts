/**
 * Provider Interface for Agni SDK.
 *
 * Every AI provider must implement this contract.
 *
 * Examples:
 * - Gemini
 * - OpenAI
 * - Anthropic
 *
 * Runtime only knows this interface.
 * It never knows provider SDK details.
 */

import type { ModelRequest, ModelResponse } from '../core/types.js';

/**
 * Provider metadata.
 */
export interface ProviderInfo {
  /**
   * Provider identifier.
   *
   * Example:
   * "gemini"
   * "openai"
   */
  name: string;

  /**
   * Model identifier.
   *
   * Example:
   * "gemini-2.5-flash"
   */
  model: string;
}

/**
 * Main provider contract.
 */
export interface ModelProvider {
  /**
   * Provider information.
   */
  readonly info: ProviderInfo;

  /**
   * Generate a model response.
   *
   * Provider adapters convert
   * native SDK responses into
   * Agni ModelResponse.
   */
  generate(request: ModelRequest): Promise<ModelResponse>;
}
