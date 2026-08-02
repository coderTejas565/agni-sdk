/**
 * Gemini Request Builder.
 *
 * Converts Agni's normalized
 * ModelRequest into a Gemini
 * GenerateContent request.
 *
 * This is the only place that knows
 * Gemini's request format.
 */

import type { Schema, Content } from '@google/genai';

import type { ModelRequest, Message } from '../../core/types.js';

import { mapGeminiRole } from './gemini-role-mapper.js';

import { GenerateContentParameters } from '@google/genai';

/**
 * Build Gemini request.
 */
export function buildGeminiRequest(
  request: ModelRequest,
): Omit<GenerateContentParameters, 'model'> {
  return {
    contents: request.messages.map(buildContent),

    config: {
      temperature: request.temperature,

      tools: request.tools
        ? [
            {
              functionDeclarations: request.tools.map((tool) => ({
                name: tool.name,

                description: tool.description,

                parameters: tool.parameters as Schema,
              })),
            },
          ]
        : undefined,
    },
  };
}

/**
 * Convert one Agni Message
 * into one Gemini Content.
 */
function buildContent(message: Message): Content {
  switch (message.role) {
    /**
     * System message.
     *
     * Gemini doesn't have a
     * dedicated system role,
     * so treat it as a user
     * instruction.
     */
    case 'system':
      return {
        role: 'user',

        parts: [
          {
            text: message.content,
          },
        ],
      };

    /**
     * User message.
     */
    case 'user':
      return {
        role: mapGeminiRole(message),

        parts: [
          {
            text: message.content,
          },
        ],
      };

    /**
     * Normal assistant text.
     */
    case 'assistant':
      /**
       * Tool call.
       */
      if ('toolCall' in message) {
        return {
          role: 'model',

          parts: [
            {
              functionCall: {
                id: message.toolCall.id,

                name: message.toolCall.name,

                args: message.toolCall.arguments,
              },
            },
          ],
        };
      }

      /**
       * Assistant text.
       */
      return {
        role: 'model',

        parts: [
          {
            text: message.content,
          },
        ],
      };

    /**
     * Tool execution result.
     */
    case 'tool':
      return {
        role: 'user',

        parts: [
          {
            functionResponse: {
              id: message.toolResult.toolCallId,

              name: message.toolResult.name,

              response: {
                output: message.toolResult.output,
              },
            },
          },
        ],
      };
  }
}
