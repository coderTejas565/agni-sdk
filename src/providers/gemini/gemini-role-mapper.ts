/**
 * Gemini Role Mapper.
 *
 * Converts Agni Messages into
 * Gemini conversation roles.
 *
 * This file is intentionally small.
 * It only maps roles.
 *
 * Message → Parts conversion lives in:
 *
 * gemini-request-builder.ts
 */

import type { Message } from '../../core/types.js';

/**
 * Gemini supports only:
 *
 * - user
 * - model
 *
 * Tool responses are represented
 * as user messages containing
 * functionResponse parts.
 */
export type GeminiRole = 'user' | 'model';

/**
 * Map Agni Message
 * to Gemini role.
 */
export function mapGeminiRole(message: Message): GeminiRole {
  switch (message.role) {
    case 'assistant':
      return 'model';

    case 'system':
    case 'user':
    case 'tool':
    default:
      return 'user';
  }
}
