// src/runtime.ts

import type { Content } from '@google/genai';

import { generate } from './gemini-provider.js';
import { executeTool, getToolDefinitions } from './tool-registry.js';

export async function run(userInput: string) {
  const messages: Content[] = [
    {
      role: 'user',
      parts: [
        {
          text: userInput,
        },
      ],
    },
  ];

  while (true) {
    console.log('\n🤖 Calling Gemini...\n');

    const response = await generate(messages, getToolDefinitions());

    const candidate = response.candidates?.[0];

    if (!candidate) {
      throw new Error('No response from Gemini.');
    }

    const part = candidate.content?.parts?.[0];

    if (!part) {
      throw new Error('Empty response from Gemini.');
    }

    // --------------------------------------------------
    // TOOL CALL
    // --------------------------------------------------

    if (part.functionCall) {
      const { name, args } = part.functionCall;

      if (!name) {
        throw new Error('Function call is missing a name.');
      }

      console.log(`🛠️ Tool Requested: ${name}`);
      console.log('Arguments:', args);

      const result = await executeTool(name, args ?? {});

      console.log('✅ Tool Result:', result);

      // Preserve model tool request
      messages.push({
        role: 'model',
        parts: [
          {
            functionCall: {
              name,
              ...(args ? { args } : {}),
            },
          },
        ],
      });

      // Send tool response back to Gemini
      messages.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name,
              response: {
                output: result,
              },
            },
          },
        ],
      });

      continue;
    }

    // --------------------------------------------------
    // FINAL ANSWER
    // --------------------------------------------------

    const text = part.text;

    if (!text) {
      throw new Error('Gemini returned empty text.');
    }

    console.log('\n🎉 Final Answer:\n');
    console.log(text);

    return text;
  }
}
