# 006 — Provider

**Status:** Draft  
**Phase:** API Design  
**Component:** Provider API  
**Owner:** Agni SDK

---

# Overview

Providers are the bridge between Agni Runtime and external AI model platforms.

A Provider is responsible for communicating with model APIs such as:

- Gemini.
- OpenAI.
- Anthropic.
- Other future providers.

The Agent and Runtime should not know provider-specific implementation details.

---

# Design Decision

Agni exposes a provider-agnostic model interface.

Users configure models through providers, but the Runtime only interacts with Agni internal types.

---

# Core Mental Model

```
Agent

↓

Model Interface

↓

Provider Adapter

↓

External AI Provider

↓

Gemini / OpenAI / Anthropic

```

---

# Why Provider Abstraction Exists

Without abstraction:

```ts
import GeminiSDK from '@google/genai';

runtime.callGemini();
```

Problems:

- Runtime becomes coupled to Gemini.
- Adding another provider requires rewriting core logic.
- Provider-specific types leak everywhere.

---

With abstraction:

```
Runtime

↓

Model Interface

↓

Gemini Adapter

or

OpenAI Adapter

or

Anthropic Adapter

```

---

# Basic Usage

Example:

```ts
const agent = new Agent({
  model: gemini('gemini-2.5-flash'),
});
```

---

The Agent only knows:

```
model
```

It does not know:

```
Gemini SDK
OpenAI SDK
Anthropic SDK
```

---

# Provider Responsibilities

A Provider handles:

## Request Conversion

Convert Agni request format:

```ts
{
  (messages, tools);
}
```

into provider format.

---

## API Communication

Example:

```
HTTP Request

↓

Provider API

↓

HTTP Response
```

---

## Response Conversion

Convert provider response into Agni internal format.

---

# Provider Does Not Own

Provider should not handle:

```
Tool execution

Runtime loop

Memory

Guardrails

Agent state

Conversation management

```

---

# Provider Interface

Conceptual interface:

```ts
interface ModelProvider {
  generate(request: ModelRequest): Promise<ModelResponse>;

  stream?(request: ModelRequest): AsyncIterable<ModelChunk>;
}
```

---

# Internal Model Request

Agni defines its own request format.

Example:

```ts
interface ModelRequest {
  messages: Message[];

  tools?: ToolDefinition[];

  model?: string;

  options?: ModelOptions;
}
```

---

The Runtime sends this format.

---

# Internal Model Response

Providers return normalized responses.

Example:

```ts
interface ModelResponse {
  type: 'text' | 'tool_call';

  content?: string;

  toolCall?: ToolCall;
}
```

---

The Runtime understands this format.

---

# Provider Adapter

Each provider has an adapter.

Example:

```
Gemini

↓

Gemini Adapter

↓

Agni Model Interface

```

---

Responsibilities:

- Map messages.
- Map tools.
- Parse responses.
- Normalize errors.

---

# Example Gemini Adapter

Internal:

```ts
{
 type:"tool_call",

 toolCall:{
   name:"get_weather",
   arguments:{
     city:"Pune"
   }
 }
}
```

---

Gemini response:

```ts
{
 functionCall:{
   name:"get_weather",
   args:{
     city:"Pune"
   }
 }
}
```

---

Adapter performs conversion.

---

# Provider Factory

Users should not create adapters manually.

Example:

```ts
const model = gemini('gemini-2.5-flash');
```

---

Internally:

```
gemini()

↓

Gemini Provider

↓

Gemini Adapter

```

---

# Provider Configuration

Provider configuration belongs at creation time.

Example:

```ts
const model = gemini('gemini-2.5-flash', {
  temperature: 0.7,
});
```

---

Not during execution:

Avoid:

```ts
run(agent, input, {
  temperature: 0.7,
});
```

---

Reason:

Agent configuration should remain predictable.

---

# Provider Options

Agni supports provider-specific options without polluting the core API.

Example:

```ts
const model =
 gemini(
  "gemini-2.5-flash",
  {

   providerOptions:{

    safetySettings:[...]

   }

  }
 );
```

---

Core remains provider-agnostic.

Advanced users still access provider features.

---

# Multi Provider Support

The same Agent can use different providers.

Example:

Development:

```ts
model: gemini('gemini-2.5-flash');
```

---

Production:

```ts
model: openai('gpt-5');
```

---

Agent code remains unchanged.

---

# Provider Error Handling

Provider failures are normalized.

Examples:

External error:

```
Gemini API Timeout
```

---

Becomes:

```ts
{
 type:"provider_error",

 provider:"gemini",

 message:"Request timeout"
}
```

---

Runtime decides:

- Retry.
- Stop.
- Return failure result.

---

# Streaming Support

Providers may support streaming.

Example:

```ts
model.stream();
```

---

Flow:

```
Provider Stream

↓

Adapter

↓

Agni Stream Events

↓

User

```

---

Streaming is optional.

A provider can support:

```
generate()

only

```

and add streaming later.

---

# Cancellation Support

Providers receive AbortSignal.

Example:

```ts
generate({
  signal,
});
```

---

Used for:

- User cancellation.
- Request timeout.
- Resource cleanup.

---

# Provider Security

API keys belong to provider configuration.

Example:

```ts
gemini({
  apiKey: process.env.KEY,
});
```

---

Never:

- Send keys through messages.
- Store keys in Agent.
- Expose keys to tools.

---

# Provider Lifecycle

```
Create Provider

↓

Attach to Agent

↓

Runtime Calls Provider

↓

Provider Adapter

↓

External API

```

---

# Final API Contract

Simple:

```ts
const model = gemini('gemini-2.5-flash');

const agent = new Agent({
  model,
});
```

---

Advanced:

```ts
const model = gemini('gemini-2.5-flash', {
  temperature: 0.7,

  providerOptions: {
    safetySettings,
  },
});
```

---

# Final Decision

Providers are isolated communication layers between Agni and external AI platforms.

The Runtime operates only on Agni internal model types.

This guarantees:

- Multi-provider support.
- Stable public API.
- Provider flexibility.
- Clean architecture.

Provider abstraction is a core boundary of Agni SDK.
