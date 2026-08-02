# 005 — Provider

**Status:** Draft  
**Phase:** API Design  
**Owner:** Agni SDK

---

# Overview

A **Provider** is the abstraction layer between Agni SDK and external Language Model providers.

Providers are responsible for communicating with model APIs such as Gemini, OpenAI, Anthropic, or future providers.

The Provider converts Agni's internal request format into provider-specific API requests and converts provider responses back into Agni internal types.

The Runtime never communicates directly with external AI SDKs.

---

# Responsibilities

A Provider is responsible for:

- Sending model requests.
- Handling provider authentication.
- Managing provider-specific SDK communication.
- Supporting provider capabilities.
- Normalizing responses into Agni internal formats.

A Provider is **not** responsible for:

- Running the agent loop.
- Executing tools.
- Managing memory.
- Applying guardrails.
- Deciding when to stop execution.
- Managing conversation state.

Those responsibilities belong to the Runtime.

---

# Design Principles

## 1. Provider Agnostic Core

The Agni Runtime must not know which model provider is being used.

Example:

```ts
model: gemini();
```

or:

```ts
model: openai();
```

The Runtime interacts with both through the same Provider interface.

---

# 2. Provider SDKs Stay Isolated

External SDK types should never leak into the core runtime.

Incorrect:

```ts
Runtime

↓

Gemini Content

↓

Gemini FunctionCall
```

Correct:

```
Gemini SDK

↓

Gemini Provider Adapter

↓

Agni Internal Types

↓

Runtime
```

This prevents provider lock-in.

---

# 3. Internal Types Are the Source of Truth

Agni defines its own internal representations.

Example:

```ts
type ModelMessage = {
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
};
```

The Gemini provider converts:

```
Agni Message

↓

Gemini Content
```

The OpenAI provider converts:

```
Agni Message

↓

OpenAI Chat Message
```

---

# 4. Capability-Based Design

Different providers support different capabilities.

Examples:

- Streaming
- Tool calling
- Structured output
- Vision
- Audio
- Reasoning models

The Provider should expose capabilities explicitly.

Example:

```ts
provider.capabilities.tools;
```

rather than assuming every model supports everything.

---

# 5. Provider Options Escape Hatch

The public API remains provider agnostic.

However, advanced users may need provider-specific features.

Example:

```ts
run(agent, input, {
  providerOptions: {
    gemini: {
      thinkingConfig: {
        thinkingBudget: 2048,
      },
    },
  },
});
```

This avoids leaking provider APIs into the core SDK.

---

# Conceptual Public API

```ts
interface Provider<TContext = unknown> {
  /**
   * Provider identifier.
   */
  readonly name: string;

  /**
   * Provider capabilities.
   */
  readonly capabilities: ProviderCapabilities;

  /**
   * Generate a model response.
   */
  generate(request: ModelRequest<TContext>): Promise<ModelResponse>;

  /**
   * Optional streaming support.
   */
  stream?(request: ModelRequest<TContext>): AsyncIterable<ModelChunk>;
}
```

---

# Model Request

The Runtime sends provider-independent requests.

```ts
interface ModelRequest<TContext = unknown> {
  /**
   * Conversation messages.
   */
  messages: ModelMessage[];

  /**
   * Available tools.
   */
  tools?: ModelTool[];

  /**
   * Execution context.
   */
  context?: RunContext<TContext>;

  /**
   * Provider specific configuration.
   */
  providerOptions?: Record<string, unknown>;
}
```

---

# Model Response

Providers return normalized responses.

```ts
interface ModelResponse {
  /**
   * Generated text.
   */
  text?: string;

  /**
   * Requested tool calls.
   */
  toolCalls?: ToolCall[];

  /**
   * Usage information.
   */
  usage?: TokenUsage;
}
```

---

# Tool Call Normalization

Different providers return different formats.

Example:

Gemini:

```ts
{
  functionCall: {
    name: "weather",
    args: {}
  }
}
```

OpenAI:

```ts
{
  tool_calls: [
    {
      function: {
        name: 'weather',
      },
    },
  ];
}
```

Agni normalizes both:

```ts
{
  name: "weather",
  arguments: {}
}
```

The Runtime only understands Agni types.

---

# Creating Providers

Providers are created through provider packages.

Example:

```ts
import { gemini } from '@agni/gemini';

const model = gemini({
  apiKey: process.env.GEMINI_KEY,
});
```

The Agent does not know the implementation.

```ts
const agent = new Agent({
  model,
});
```

---

# Example Provider Flow

```
Runtime

↓

Provider Interface

↓

Gemini Provider

↓

Gemini SDK

↓

Gemini API

↓

Gemini Response

↓

Gemini Provider Adapter

↓

Agni Model Response

↓

Runtime
```

---

# Error Handling

Provider errors are categorized.

Expected failures:

- Rate limits
- Invalid requests
- Context length exceeded
- Authentication failures

These should return structured provider errors.

Example:

```ts
{
  type: "provider_error",
  code: "RATE_LIMIT",
  message: "Too many requests"
}
```

Unexpected failures may throw.

Examples:

- SDK bugs
- Network crashes
- Internal implementation errors

---

# Retry Responsibility

Retries should not live inside the Provider.

Reason:

The Runtime understands the execution context.

Example:

A provider failure during:

```
Tool execution
      |
Provider retry
      |
Continue loop
```

may require different handling than a failure during final generation.

Therefore:

```
Provider

↓

Runtime Retry Policy
```

---

# Streaming

Streaming is an optional Provider capability.

Providers that support streaming expose:

```ts
stream();
```

The Runtime decides whether streaming is enabled.

Example:

```ts
const result = await run(agent, input, {
  stream: true,
});
```

---

# Alternatives Considered

## Direct Provider SDK Usage

Example:

```ts
runtime.callGemini();
```

Pros:

- Simple initially.

Cons:

- Provider lock-in.
- Hard to support multiple providers.
- Core becomes coupled.

Decision:

Rejected.

---

## Provider Returns Raw SDK Response

Example:

```ts
return geminiResponse;
```

Pros:

- Less adapter code.

Cons:

- Runtime depends on external SDKs.
- Every provider requires different handling.

Decision:

Rejected.

---

## Provider Adapter Pattern

Example:

```
Provider SDK

↓

Adapter

↓

Agni Types
```

Pros:

- Clean separation.
- Multi-provider support.
- Stable Runtime.

Decision:

Accepted.

---

# Relationship With Other Components

```
Agent

↓

Runtime

↓

Provider

↓

External Model API
```

The Provider is a boundary between Agni and external AI systems.

---

# Future Considerations

Possible future Provider capabilities:

- Batch generation.
- Model routing.
- Fallback providers.
- Cost optimization.
- Provider load balancing.
- Multi-model execution.

The Provider abstraction should allow these without changing the Agent API.

---

# Final Decision

Agni SDK adopts a provider adapter architecture.

Providers isolate external model APIs while exposing a stable internal interface to the Runtime.

The Runtime owns execution decisions, while Providers only own model communication.

This creates a multi-provider, extensible foundation for production-grade AI agents.
