# 001 — Provider Interface

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Provider System  
**Owner:** Agni SDK

---

# Overview

The Provider Interface defines how Agni SDK communicates with different Large Language Model providers.

Examples:

- Gemini
- OpenAI
- Anthropic
- Future model providers

The Provider layer is responsible for translating between:

```
Agni Internal Types

        ↓

Provider Implementation

        ↓

External AI SDK
```

The Runtime should never directly communicate with provider SDKs.

---

# Design Goal

The Provider System should provide:

- Model provider independence.
- Consistent Runtime behavior.
- Easy addition of new providers.
- No external SDK leakage.
- Provider-specific feature support.

---

# Core Principle

The Runtime should understand:

```
Generate Response

Process Tool Call

Receive Stream
```

It should not understand:

```
Gemini Content

OpenAI ChatCompletion

Anthropic Messages API
```

---

# Architecture Position

```
                Runtime

                   |

                   |

            Provider Interface

                   |

        +----------+----------+

        |          |          |

     Gemini     OpenAI    Anthropic

        |          |          |

     SDK API    SDK API    SDK API

```

---

# Responsibilities

The Provider Interface is responsible for:

---

## 1. Sending Model Requests

Example:

Runtime:

```ts
provider.generate({
  messages,
  tools,
});
```

Provider converts:

```
Agni Request

↓

Provider Format

↓

External API
```

---

## 2. Receiving Model Responses

Provider converts:

External response:

```
Gemini Response
```

into:

```
Agni Response
```

Example:

```ts
{
 type:"text",

 content:"Hello"
}
```

or:

```ts
{
 type:"tool_call",

 name:"weather",

 arguments:{
  city:"Pune"
 }
}
```

---

## 3. Provider Authentication

Providers handle:

- API keys.
- SDK initialization.
- Connection setup.

Example:

```ts
new GeminiProvider({
  apiKey,
});
```

---

## 4. Provider Capabilities

Providers expose supported features.

Example:

```ts
{
 streaming:true,

 tools:true,

 structuredOutput:false
}
```

The Runtime can adapt behavior.

---

# Non Responsibilities

The Provider must not:

- Execute tools.
- Manage agent loops.
- Store memory.
- Apply guardrails.
- Control retries.
- Create traces.

These belong to other systems.

---

# Internal Request Model

The Runtime sends provider-independent data.

Example:

```ts
interface ProviderRequest {
  messages: Message[];

  tools?: ToolDefinition[];

  temperature?: number;

  signal?: AbortSignal;
}
```

Important:

This is an Agni type.

Not:

```ts
GeminiContent[]
```

or:

```ts
OpenAIMessage[]
```

---

# Internal Response Model

Every provider returns:

```ts
interface ProviderResponse {
  type: 'text' | 'tool_call';

  text?: string;

  toolCall?: {
    name: string;

    arguments: Record<string, unknown>;
  };
}
```

The Runtime only understands this format.

---

# Tool Calling Flow

Example:

User:

```
Weather in Pune?
```

Flow:

```
Runtime

↓

Provider.generate()

↓

Gemini Provider

↓

Gemini API

↓

Function Call Response

↓

Normalize

↓

Agni ToolCall

↓

Runtime
```

---

# Provider Interface

Conceptual interface:

```ts
interface Provider {
  generate(request: ProviderRequest): Promise<ProviderResponse>;

  stream?(request: ProviderRequest): AsyncIterable<ProviderChunk>;
}
```

---

# Why Provider Owns Normalization?

Different providers return different structures.

Example:

Gemini:

```ts
{
  functionCall: {
    (name, args);
  }
}
```

OpenAI:

```ts
{
  tool_calls: [
    {
      function: {
        name,
        arguments,
      },
    },
  ];
}
```

Anthropic:

```ts
{
  content: [
    {
      type: 'tool_use',
    },
  ];
}
```

The Runtime should not handle all formats.

Provider responsibility:

```
Provider Response

↓

Normalize

↓

Agni Response
```

---

# Provider Lifecycle

```
CREATE

↓

INITIALIZE

↓

READY

↓

REQUEST

↓

RESPONSE

↓

ERROR

↓

CLOSE
```

---

# Provider Initialization

Example:

```ts
const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_KEY,
});
```

The Provider manages:

- SDK client creation.
- Configuration.
- Authentication.

---

# Multiple Provider Support

Example:

```ts
const agent = new Agent({
  model: gemini('flash'),
});
```

Future:

```ts
const agent = new Agent({
  model: claude('sonnet'),
});
```

The Agent API remains unchanged.

---

# Provider Options

Some providers expose unique capabilities.

Example:

Gemini:

```ts
{
  safetySettings: [];
}
```

OpenAI:

```ts
{
  reasoningEffort: 'high';
}
```

The public API should support:

```ts
providerOptions: {
  gemini: {
    safetySettings: [];
  }
}
```

Without leaking provider SDK types.

---

# Error Handling

Provider errors are normalized.

Examples:

External:

```
429 Rate Limit
```

Becomes:

```ts
{
 type:"rate_limit",

 retryable:true
}
```

Runtime decides recovery.

---

# Security Considerations

Provider layer protects:

- API keys.
- Credentials.
- External SDK details.

Never expose:

```ts
GeminiClient;
```

to:

- Runtime
- Tools
- User code

---

# Alternatives Considered

---

## Runtime Directly Uses Provider SDK

Example:

```ts
runtime.google.generate();
```

Rejected.

Problems:

- No multi-provider support.
- Tight coupling.
- Difficult testing.

---

## One Universal Provider SDK Object

Example:

```ts
provider.call();
```

Rejected.

Reason:

Too generic and loses type safety.

---

## Provider Logic Inside Runtime

Rejected.

Reason:

Runtime becomes responsible for:

- AI vendors.
- API formats.
- Authentication.

---

# Design Decisions

## Decision 001 — Provider Is an Adapter

Accepted.

Provider converts:

```
External AI API

↓

Agni Internal Types
```

---

## Decision 002 — Runtime Is Provider Agnostic

Accepted.

Runtime only knows:

```ts
Provider Interface
```

---

## Decision 003 — Provider Types Never Leak

Accepted.

External SDK types stay inside provider packages.

---

# Final Decision

Agni SDK uses a provider abstraction layer:

```
Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External AI Provider

↓

LLM
```

The Provider System isolates vendor differences and allows Agni SDK to support multiple AI providers without changing the core execution engine.
