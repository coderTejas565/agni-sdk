// src/weather-tool.ts

import { Type } from '@google/genai';

export const weatherTool = {
  name: 'get_weather',

  description: 'Get the current weather for a given city.',

  parameters: {
    type: Type.OBJECT,

    properties: {
      city: {
        type: Type.STRING,
        description: 'The name of the city.',
      },
    },

    required: ['city'],
  },

  async execute(args: unknown) {
    const { city } = args as {
      city: string;
    };

    return {
      city,
      temperature: '28°C',
      condition: 'Sunny',
      humidity: '62%',
    };
  },
};
