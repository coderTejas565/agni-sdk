# Agni Agent SDK

Agni Agent SDK is a TypeScript-first framework for building AI agents with tool calling and provider abstraction.

It provides a lightweight runtime for creating production-ready AI agents while keeping providers, tools, and execution logic decoupled.

## Features

- TypeScript-first API
- Provider abstraction
- Tool calling runtime
- Execution context
- Runtime limits
- Event system
- Extensible architecture
- ESM and CommonJS support

> **Status:** Early Preview (v1.0.0)

Agni Agent SDK is under active development. The public API may evolve in future releases.

## Installation

```bash
npm install agni-agent-sdk
```

or

```bash
pnpm add agni-agent-sdk
```

or

```bash
yarn add agni-agent-sdk
```

---

## Quick Start

```ts
import 'dotenv/config';

import { Agent, Runner, GeminiProvider } from 'agni-agent-sdk';

const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
});

const agent = new Agent({
  name: 'assistant',

  instructions: 'You are a helpful AI assistant.',

  provider,
});

const runner = new Runner();

const result = await runner.run(agent, 'Explain what an AI agent is.', {
  context: {},
});

console.log(result.output);
```

---

## Tool Calling

Register tools directly on an Agent.

```ts
import type { Tool } from 'agni-agent-sdk';

const weatherTool: Tool = {
  name: 'get_weather',

  description: 'Returns the weather for a city.',

  parameters: {
    type: 'object',

    properties: {
      city: {
        type: 'string',
      },
    },

    required: ['city'],
  },

  async execute({ city }) {
    return {
      city,
      temperature: 29,
      condition: 'Sunny',
    };
  },
};
```

Attach the tool to an Agent.

```ts
const agent = new Agent({
  name: 'weather',

  instructions: 'Always use the weather tool when answering weather questions.',

  provider,

  tools: [weatherTool],
});
```

Run the agent.

```ts
const result = await runner.run(agent, 'What is the weather in Pune?', {
  context: {},
});
```

---

## Providers

Agni SDK communicates with language models through provider adapters.

Currently supported providers:

- Gemini

Additional providers such as OpenAI and Anthropic are planned for future releases.

Example:

```ts
const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
});
```

The runtime depends only on the provider interface, allowing additional providers to be added without changing application code.

---

## Agent

An Agent is an immutable configuration object.

It contains:

- Name
- Instructions
- Provider
- Tools
- Runtime limits
- Provider options

Example:

```ts
const agent = new Agent({
  name: 'assistant',

  instructions: 'You are helpful.',

  provider,
});
```

---

## Runner

Runner is responsible for execution.

Responsibilities include:

- Managing conversation history
- Calling the provider
- Executing tools
- Applying runtime limits
- Returning normalized results
- Publishing runtime events

Example:

```ts
const runner = new Runner();

const result = await runner.run(agent, 'Hello', {
  context: {},
});
```

---

## Execution Context

Context contains application-specific runtime data.

Example:

```ts
await runner.run(agent, prompt, {
  context: {
    userId: '123',
    workspaceId: 'abc',
  },
});
```

Tools receive the same context during execution.

---

## Result

Every execution returns a normalized result.

```ts
{
  success: true,

  output: "...",

  metadata: {
    runId: "...",
    turns: 2,
  }
}
```

On failure:

```ts
{
  success: false,

  error: {
    type: "...",
    message: "...",
  }
}
```

---

## Runtime Events

The Runner exposes an event bus.

```ts
runner.events.on('tool.called', (event) => {
  console.log(event.toolName);
});
```

Examples of events include:

- agent.started
- turn.started
- provider.request
- provider.response
- tool.called
- tool.completed
- agent.completed

---

## Architecture

Agni SDK separates responsibilities into dedicated modules.

```
Agent
   │
Runner
   │
Provider
   │
Tool Registry
   │
Tool Executor
   │
Result
```

This architecture makes providers and tools independent from the runtime implementation.

---

## Project Structure

```
src/
 ├── core/
 ├── providers/
 ├── tools/
 ├── streaming/
 ├── errors/
 ├── utils/
 └── index.ts
```

---

## Requirements

- Node.js 18+
- TypeScript 5+

---

## Documentation

Documentation is currently under development.

In the meantime, refer to the examples in this repository to get started.

---

## Roadmap

Planned features include:

- OpenAI provider
- Anthropic provider
- Streaming responses
- Memory
- Guardrails
- Structured outputs
- Multi-agent orchestration
- Tracing
- Handoffs

---

## Contributing

Contributions are welcome.

If you find a bug or have an idea for a new feature, please open an issue or submit a pull request.

---

## Repository

https://github.com/coderTejas565/agni-sdk

---

## License

MIT
