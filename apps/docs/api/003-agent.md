# 003 — Agent

**Status:** Draft  
**Phase:** API Design  
**Owner:** Agni SDK

---

# Overview

The **Agent** is the primary configuration object in Agni SDK.

It defines **what an AI agent is**, not **how it executes**.

An Agent is an immutable description of an AI assistant, including its instructions, model, tools, memory, guardrails, and execution defaults.

The Runtime consumes an Agent to perform execution.

---

# Responsibilities

The Agent is responsible for defining:

- Identity
- Behavior
- Model
- Available Tools
- Memory configuration
- Guardrails
- Execution defaults

The Agent is **not** responsible for:

- Executing prompts
- Managing conversations
- Calling Providers
- Running Tools
- Managing Runtime state
- Handling retries
- Streaming responses

Execution always belongs to the Runtime.

---

# Design Principles

## 1. Configuration, Not Execution

An Agent is a declarative object.

It describes capabilities but performs no work.

Example:

```ts
const assistant = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
  model: gemini(),
});
```

Execution is performed separately.

```ts
const result = await run(assistant, 'Explain TypeScript.');
```

This separation keeps the API predictable and reusable.

---

## 2. Immutable by Design

After creation, an Agent cannot be modified.

Example:

```ts
const assistant = new Agent({
  model: gemini(),
});
```

Not allowed:

```ts
assistant.model = openai();
```

If configuration changes are required, create a new Agent.

---

## 3. Clone Instead of Mutation

To support configuration overrides without mutation, Agents provide a cloning mechanism.

Example:

```ts
const creativeAssistant = assistant.clone({
  model: gemini({
    temperature: 1,
  }),
});
```

Benefits:

- Predictable behavior
- Safe reuse
- Easier testing
- No hidden state changes

---

## 4. Explicit Configuration

Every capability is explicitly declared.

Example:

```ts
const assistant = new Agent({
  model: gemini(),
  tools: [weatherTool, calculatorTool],
  memory,
  guardrails,
});
```

No automatic discovery or registration occurs.

---

## 5. Provider Agnostic

The Agent depends only on the Provider interface.

It never depends on Gemini-, OpenAI-, or Anthropic-specific APIs.

Example:

```ts
model: gemini();
```

or

```ts
model: openai();
```

The Runtime interacts through the Provider abstraction.

---

## 6. TypeScript First

The Agent should maximize:

- IntelliSense
- Type inference
- Compile-time validation

Public APIs should avoid `any`.

---

# Conceptual Public API

```ts
interface AgentOptions<TContext = unknown> {
  /**
   * Human-readable name.
   */
  name?: string;

  /**
   * System instructions.
   */
  instructions: string;

  /**
   * Language model provider.
   */
  model: Provider<TContext>;

  /**
   * Available tools.
   */
  tools?: Tool<TContext>[];

  /**
   * Memory configuration.
   */
  memory?: Memory<TContext>;

  /**
   * Guardrails.
   */
  guardrails?: Guardrail<TContext>[];

  /**
   * Runtime defaults.
   */
  defaults?: RunDefaults;

  /**
   * Optional metadata.
   */
  metadata?: Record<string, unknown>;
}

class Agent<TContext = unknown> {
  constructor(options: AgentOptions<TContext>);

  clone(overrides: Partial<AgentOptions<TContext>>): Agent<TContext>;
}
```

This represents the conceptual public API rather than the final implementation.

---

# Why Is Agent Generic?

The Agent carries the application context type through the SDK.

Example:

```ts
type AppContext = {
  userId: string;
  db: Database;
};

const assistant = new Agent<AppContext>({
  model: gemini(),
});
```

Every Tool, Memory implementation, and Guardrail receives the same strongly typed context during execution.

---

# Minimal Example

```ts
const assistant = new Agent({
  instructions: 'You are a helpful assistant.',
  model: gemini(),
});
```

---

# Agent with Tools

```ts
const assistant = new Agent({
  instructions: '...',
  model: gemini(),
  tools: [weatherTool, calculatorTool],
});
```

---

# Agent with Memory

```ts
const assistant = new Agent({
  instructions: '...',
  model: gemini(),
  memory: vectorMemory(),
});
```

---

# Agent with Guardrails

```ts
const assistant = new Agent({
  instructions: '...',
  model: gemini(),
  guardrails: [safetyGuardrail],
});
```

---

# Complete Example

```ts
const assistant = new Agent<AppContext>({
  name: 'Travel Assistant',

  instructions: 'Help users plan their trips.',

  model: gemini(),

  tools: [weatherTool, mapsTool],

  memory: vectorMemory(),

  guardrails: [safetyGuardrail],
});
```

---

# Why Not Put `run()` on the Agent?

Example:

```ts
await agent.run(prompt);
```

This couples configuration with execution.

The Agent becomes responsible for Runtime behavior.

Instead:

```ts
await run(agent, prompt);
```

keeps execution inside the Runtime.

This aligns with Agni's architecture:

```
Agent

↓

Runtime

↓

Provider
```

---

# Why Not Store Conversation History?

Conversation history belongs to an execution or session.

It changes over time.

The Agent should remain reusable.

Example:

```
Agent

↓

Run #1

↓

Run #2

↓

Run #3
```

The same Agent can participate in thousands of independent executions.

---

# Why Not Store Runtime State?

Runtime state includes:

- Current messages
- Tool calls
- Active turn count
- Provider responses
- Execution status

These values exist only during execution.

Storing them inside the Agent would make Agents stateful and difficult to reuse.

---

# Extensibility

Future versions may introduce additional configuration.

Examples:

- Handoffs
- Structured outputs
- Retry policies
- Event hooks
- Observability defaults
- Sessions

Because the Agent is declarative, these additions remain backward compatible.

---

# Alternatives Considered

## Mutable Agent

Example:

```ts
agent.model = openai();
```

**Pros**

- Simple updates.

**Cons**

- Hidden state changes.
- Harder debugging.
- Reduced predictability.
- Poor reuse.

**Decision**

Rejected.

---

## Builder Pattern

Example:

```ts
Agent.create()
  .model(...)
  .tool(...)
```

**Pros**

- Fluent API.
- Good discoverability.

**Cons**

- More implementation complexity.
- Harder serialization.
- Less familiar for configuration-heavy objects.

**Decision**

Deferred.

A builder may be introduced later as optional syntax while preserving the object-based constructor.

---

## Configuration Object

Example:

```ts
new Agent({
  ...
});
```

**Pros**

- Explicit.
- Serializable.
- Excellent TypeScript support.
- Easy to understand.

**Decision**

Accepted.

---

# Relationship with Runtime

The Agent never performs execution.

The Runtime consumes an Agent and creates a Run Context.

```
Agent

↓

Runtime

↓

Run Context

↓

Provider

↓

Run Result
```

This separation keeps responsibilities clear and aligns with Agni's architecture.

---

# Future Considerations

The Agent is intentionally lightweight.

Its responsibility is limited to describing an AI agent.

Execution, state management, observability, memory retrieval, and provider communication remain separate concerns.

This enables Agni SDK to evolve internally while keeping the public Agent API stable.

---

# Final Decision

Agni SDK adopts an **immutable, declarative Agent** as the central configuration object.

The Agent describes the capabilities and behavior of an AI assistant while delegating all execution responsibilities to the Runtime.

This separation provides a predictable, extensible, and production-grade foundation for the SDK.
