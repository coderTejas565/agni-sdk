# Agni Agent SDK

<p align="center">
  <img src="https://img.shields.io/npm/v/agni-agent-sdk" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/agni-agent-sdk" alt="npm downloads" />
  <img src="https://img.shields.io/github/license/coderTejas565/agni-sdk" alt="license" />
  <img src="https://img.shields.io/node/v/agni-agent-sdk" alt="node version" />
</p>

Agni Agent SDK is a TypeScript-first framework for building reliable AI agents with tool calling, provider abstraction, and a modular runtime architecture.

It provides the core building blocks required to create AI applications where agents, models, tools, and execution logic remain independent and composable.

> Status: Early Preview (v1.0.0)

Agni Agent SDK is actively evolving. APIs may change as the framework matures.

---

## Why Agni?

Building AI agents often requires managing:

- Model communication
- Tool execution
- Conversation state
- Runtime control
- Provider differences
- Execution lifecycle

Agni abstracts these concerns into a clean runtime so developers can focus on building agent applications.

```
Application
    |
    v
Agent
    |
    v
Agni Runtime
    |
    +----------------+
    |                |
 Provider          Tools
    |                |
 Gemini        External APIs
```

---

# Installation

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

# Quick Start

Create your first AI agent:

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

const result = await runner.run(agent, 'Explain how AI agents work.', {
  context: {},
});

console.log(result.output);
```

---

# Core Concepts

Agni is built around a few simple primitives:

| Component  | Responsibility                     |
| ---------- | ---------------------------------- |
| Agent      | Defines behavior and capabilities  |
| Runner     | Executes the agent lifecycle       |
| Provider   | Connects to language models        |
| Tool       | Gives agents external capabilities |
| RunContext | Stores execution-specific data     |
| Events     | Observes runtime activity          |

---

# Tool Calling

Agents can use external tools to perform actions.

Example:

```ts
import type { Tool } from 'agni-agent-sdk';

const weatherTool: Tool = {
  name: 'get_weather',

  description: 'Returns weather information for a city.',

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

Attach tools to an agent:

```ts
const agent = new Agent({
  name: 'weather-agent',

  instructions: 'Use tools when required.',

  provider,

  tools: [weatherTool],
});
```

---

# Providers

Agni uses provider adapters to communicate with different AI models.

Currently supported:

- Gemini

Example:

```ts
const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
});
```

The runtime depends only on the provider interface, making additional model providers easy to integrate.

Planned providers:

- OpenAI
- Anthropic

---

# Runtime Execution

The Runner manages the complete agent lifecycle:

- Creates execution context
- Sends requests to providers
- Handles tool calls
- Tracks execution turns
- Returns normalized results
- Publishes runtime events

Example:

```ts
const result = await runner.run(
  agent,

  'What is the weather in Pune?',

  {
    context: {},
  },
);
```

---

# Execution Context

Context allows applications to pass runtime data into tools and workflows.

Example:

```ts
await runner.run(
  agent,

  'Hello',

  {
    context: {
      userId: '123',
      workspaceId: 'abc',
    },
  },
);
```

---

# Results

Every execution returns a normalized result.

Success:

```ts
{
  success:true,

  output:"Agent response",

  metadata:{
    runId:"...",
    turns:2
  }
}
```

Failure:

```ts
{
  success:false,

  error:{
    type:"provider_error",

    message:"..."
  }
}
```

---

# Runtime Events

Agni exposes an event system for observing execution.

```ts
runner.events.on('tool.called', (event) => {
  console.log(event.toolName);
});
```

Available events:

- agent.started
- turn.started
- provider.request
- provider.response
- tool.called
- tool.completed
- agent.completed

---

# Architecture

Agni follows a modular runtime architecture.

```
                 Application

                     |

                   Agent

                     |

                  Runner

                     |

              Provider Interface

             /                \

        Gemini              Tools

                             |

                       Tool Executor

                             |

                           Result
```

This separation allows providers and tools to evolve independently.

---

# Project Structure

```
src/
├── core/
│   ├── agent.ts
│   ├── runner.ts
│   ├── run-context.ts
│   └── types.ts
│
├── providers/
│   └── gemini/
│
├── tools/
│
├── streaming/
│
├── errors/
│
└── index.ts
```

---

# Requirements

- Node.js 18+
- TypeScript 5+

---

# Roadmap

Future releases will introduce:

- OpenAI provider
- Anthropic provider
- Streaming responses
- Memory and sessions
- Guardrails
- Structured outputs
- Multi-agent workflows
- Tracing and observability

---

# Contributing

Contributions are welcome.

If you find bugs, have feature ideas, or want to improve Agni, please open an issue or submit a pull request.

---

# Repository

https://github.com/coderTejas565/agni-sdk

---

# License

MIT
