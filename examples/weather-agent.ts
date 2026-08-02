import 'dotenv/config';

import { Agent, Runner, GeminiProvider, type Tool } from '../src/index.js';

type AppContext = Record<string, never>;

/**
 * Simple demo tool.
 *
 * No real API calls yet.
 * Just returns mock data.
 */
const weatherTool: Tool<
  AppContext,
  { city: string },
  {
    city: string;
    temperature: number;
    condition: string;
  }
> = {
  name: 'get_weather',

  description: 'Get the current weather for a city.',

  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
      },
    },
    required: ['city'],
  },

  async execute(input) {
    console.log(`🛠 Tool executed for: ${input.city}`);

    return {
      city: input.city,
      temperature: 29,
      condition: 'Sunny',
    };
  },
};

async function main() {
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const agent = new Agent<AppContext>({
    name: 'Weather Assistant',

    instructions: `
You are a weather assistant.

Whenever a user asks about weather,
always call the get_weather tool first.

Never guess the weather yourself.
`,

    provider,

    tools: [weatherTool],
  });

  const runner = new Runner<AppContext>();

  const result = await runner.run(agent, "What's the weather in Pune?", {
    context: {},
  });

  if (!result.success) {
    console.error(result.error);
    return;
  }

  console.log('\n🤖 Final Answer\n');
  console.log(result.output);
}

main().catch((error) => {
  console.error(error);
});
