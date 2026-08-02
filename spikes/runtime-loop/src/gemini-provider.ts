// src/gemini-provider.ts

import { GoogleGenAI } from '@google/genai';
import type { Content, Schema } from '@google/genai';
import { config } from 'dotenv';

config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing.');
}

const ai = new GoogleGenAI({
  apiKey,
});

export type Message = Content;

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Schema;
};

export async function generate(messages: Message[], tools: ToolDefinition[]) {
  return ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: {
      tools: [
        {
          functionDeclarations: tools,
        },
      ],
    },
  });
}
