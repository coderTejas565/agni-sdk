/**
 * Gemini Provider for Agni SDK.
 *
 * Responsibilities:
 *
 * - Own Gemini client
 * - Build Gemini request
 * - Call Gemini SDK
 * - Parse Gemini response
 *
 * Business logic lives in:
 *
 * - gemini-request-builder.ts
 * - gemini-response-parser.ts
 */

import { GoogleGenAI } from '@google/genai';

import type { ModelProvider, ProviderInfo } from '../provider.interface.js';

import type { ModelRequest, ModelResponse } from '../../core/types.js';

import { buildGeminiRequest } from './gemini-request-builder.js';

import { parseGeminiResponse } from './gemini-response-parser.js';

export interface GeminiProviderConfig {
  apiKey: string;

  model?: string;
}

export class GeminiProvider implements ModelProvider {
  /**
   * Provider metadata.
   */
  public readonly info: ProviderInfo;

  /**
   * Gemini SDK client.
   */
  private readonly client: GoogleGenAI;

  /**
   * Model identifier.
   */
  private readonly model: string;

  constructor(config: GeminiProviderConfig) {
    this.client = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    this.model = config.model ?? 'gemini-2.5-flash';

    this.info = {
      name: 'gemini',

      model: this.model,
    };
  }

  /**
   * Generate a normalized response.
   */
  async generate(request: ModelRequest): Promise<ModelResponse> {
    const geminiRequest = buildGeminiRequest(request);

    const response = await this.client.models.generateContent({
      model: this.model,

      ...geminiRequest,
    });

    return parseGeminiResponse(response);
  }
}
