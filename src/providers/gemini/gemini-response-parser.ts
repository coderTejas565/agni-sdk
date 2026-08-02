/**
 * Gemini Response Parser.
 *
 * Converts Gemini SDK responses
 * into Agni's normalized ModelResponse.
 *
 * The Runtime never understands
 * Gemini SDK response objects.
 */

import type { GenerateContentResponse } from '@google/genai';

import type { ModelResponse, ToolCall } from '../../core/types.js';

/**
 * Parse Gemini response into
 * Agni ModelResponse.
 */
export function parseGeminiResponse(response: GenerateContentResponse): ModelResponse {
  const candidate = response.candidates?.[0];

  if (!candidate) {
    return {
      type: 'text',

      content: '',
    };
  }

  const part = candidate.content?.parts?.[0];

  if (!part) {
    return {
      type: 'text',

      content: '',
    };
  }

  /**
   * Gemini requested
   * tool execution.
   */
  if (part.functionCall) {
    const toolCall: ToolCall = {
      id: part.functionCall.id,

      name: part.functionCall.name ?? '',

      arguments: (part.functionCall.args ?? {}) as Record<string, unknown>,
    };

    return {
      type: 'tool_call',

      toolCalls: [toolCall],
    };
  }

  /**
   * Normal text response.
   */
  return {
    type: 'text',

    content: part.text ?? '',
  };
}
