/**
 * Gemini Provider Adapter for Agni SDK.
 *
 * Converts Gemini SDK communication
 * into Agni internal provider contracts.
 */

import { GoogleGenAI, type Schema } from '@google/genai';

import type { ModelProvider, ProviderInfo } from './provider.interface.js';

import type { ModelRequest, ModelResponse, ToolCall } from '../core/types.js';

export interface GeminiProviderConfig {
  apiKey: string;

  model?: string;
}

export class GeminiProvider implements ModelProvider {
  /**
   * Provider metadata.
   */
  public readonly info: ProviderInfo;

  private readonly client: GoogleGenAI;

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

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const response = await this.client.models.generateContent({
      model: this.model,

      contents: request.messages.map((message) => ({
        role: this.mapRole(message.role),

        parts: [
          {
            text:
              typeof message.content === 'string'
                ? message.content
                : message.content

                    .map((part) => part.text)

                    .join(''),
          },
        ],
      })),

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
    });

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
     * Model requested tool execution.
     */
    if (part.functionCall) {
      const toolCall: ToolCall = {
        name: part.functionCall.name ?? '',

        arguments: part.functionCall.args ?? {},
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

  private mapRole(role: 'system' | 'user' | 'assistant' | 'tool') {
    switch (role) {
      case 'assistant':
        return 'model';

      case 'tool':
        return 'user';

      case 'system':
        return 'user';

      default:
        return 'user';
    }
  }
}
