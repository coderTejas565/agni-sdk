# 004 — Tool

**Status:** Draft  
**Phase:** API Design  
**Owner:** Agni SDK

---

# Overview

A **Tool** enables an Agent to interact with the outside world.

Large Language Models are limited to reasoning over the information available in their context window. Tools extend an Agent's capabilities by allowing it to retrieve information, perform computations, and interact with external systems.

A Tool is an immutable, declarative object consisting of metadata, an input schema, and an execution function.

The Runtime is responsible for deciding **when** a Tool executes. A Tool is only responsible for defining **what** it does.

---

# Responsibilities

A Tool is responsible for:

- Describing its capability.
- Defining its input schema.
- Executing business logic.
- Returning structured results.

A Tool is **not** responsible for:

- Deciding when it executes.
- Calling the language model.
- Managing execution loops.
- Updating conversation history.
- Handling retries.
- Performing provider communication.

Those responsibilities belong to the Runtime.

---

# Design Principles

## 1. Declarative

A Tool describes a capability.

Example:

```ts
const weatherTool = tool({
  name: "get_weather",
  description: "Get current weather.",
  parameters: ...,
  execute() { ... }
});
```

The Runtime decides when to invoke it.

---

## 2. Provider Independent

A Tool has no knowledge of Gemini, OpenAI, Anthropic, or any other provider.

It should only implement business logic.

This allows the same Tool to work with every supported provider.

---

## 3. Strongly Typed

Tool inputs should be validated and inferred from a schema.

The execution function should receive fully typed input.

Example:

```ts
execute(input, ctx);
```

instead of

```ts
execute(any);
```

---

## 4. Pure Business Logic

A Tool should focus on one capability.

Examples:

- Weather lookup
- Database query
- Send email
- Search documentation
- Calculator

A Tool should avoid Runtime concerns.

---

## 5. Sync or Async

Tools may be synchronous or asynchronous.

Both are supported.

Conceptually:

```ts
execute(...) => Output | Promise<Output>
```

The Runtime always awaits the result.

---

## 6. Access Through Run Context

Tools receive execution-scoped context through the Run Context.

This allows access to:

- User information
- Database connections
- Authentication
- Request metadata
- Cancellation

without relying on global state.

---

# Conceptual Public API

```ts
interface Tool<TContext = unknown, TInput = unknown, TOutput = unknown> {
  /**
   * Unique tool identifier.
   */
  readonly name: string;

  /**
   * Human-readable description.
   */
  readonly description: string;

  /**
   * Input schema.
   */
  readonly parameters: ToolSchema<TInput>;

  /**
   * Execute the tool.
   */
  execute(input: TInput, context: RunContext<TContext>): TOutput | Promise<TOutput>;
}
```

For better developer experience, tools are created using a helper.

```ts
const weatherTool = tool({
  ...
});
```

instead of manually implementing the interface.

---

# Why Use `tool()`?

Creating tools through a helper provides:

- Better type inference.
- Simpler API.
- Automatic validation.
- Consistent metadata.
- Future extensibility.

Example:

```ts
const weatherTool = tool({
  name: "get_weather",

  description: "Get current weather.",

  parameters: weatherSchema,

  async execute(input, ctx) {
    ...
  },
});
```

---

# Minimal Example

```ts
const calculator = tool({
  name: 'calculate',

  description: 'Perform arithmetic.',

  parameters: calculatorSchema,

  execute({ a, b }) {
    return a + b;
  },
});
```

---

# Tool Using Context

```ts
type AppContext = {
  db: Database;
  userId: string;
};

const profileTool = tool<AppContext>({
  name: 'profile',

  description: 'Load current user.',

  parameters: profileSchema,

  async execute(input, ctx) {
    return ctx.context.db.users.find(ctx.context.userId);
  },
});
```

---

# Tool Using External APIs

```ts
const weatherTool = tool({
  name: 'weather',

  description: 'Get weather.',

  parameters: weatherSchema,

  async execute({ city }) {
    return weatherApi(city);
  },
});
```

The Tool contains only business logic.

The Runtime manages retries, execution order, and communication with the model.

---

# Tool Lifecycle

```
Registered

↓

Selected by Runtime

↓

Validated

↓

Executed

↓

Result Returned

↓

Runtime Continues
```

The Tool itself never loops.

---

# Tool Result

Tools return structured JavaScript values.

Example:

```ts
return {
  city: 'Pune',
  temperature: 28,
  condition: 'Sunny',
};
```

The Runtime is responsible for normalizing results before sending them back to the Provider.

Tools should not return provider-specific formats.

---

# Why Not Expose Provider Types?

Incorrect:

```ts
return new GeminiFunctionResponse(...)
```

Correct:

```ts
return {
  city,
  temperature,
};
```

Provider adapters handle any required transformation.

This keeps Tools portable across providers.

---

# Why Not Register Automatically?

Automatic discovery introduces hidden behavior.

Example:

```ts
import './tools';
```

Instead, Tools are explicitly provided.

```ts
const agent = new Agent({
  model: gemini(),

  tools: [weatherTool, calculatorTool],
});
```

This makes capabilities obvious.

---

# Error Handling

A Tool may throw when it cannot complete its work.

Example:

```ts
throw new Error('Weather service unavailable.');
```

The Runtime determines how to handle failures.

Possible strategies include:

- Retry
- Return tool error
- Ask the model to recover
- End execution

Tools should not implement Runtime policies.

---

# Extensibility

Future Tool capabilities may include:

- Streaming outputs
- Progress events
- Approval workflows
- Timeouts
- Resource limits
- Observability hooks

These should extend the Tool contract without changing its core responsibilities.

---

# Alternatives Considered

## Plain Functions

Example:

```ts
function weather() {}
```

**Pros**

- Very simple.

**Cons**

- No metadata.
- No schema.
- Difficult registration.
- Harder type inference.

**Decision**

Rejected.

---

## Class-Based Tools

```ts
class WeatherTool {}
```

**Pros**

- Familiar OOP pattern.

**Cons**

- More boilerplate.
- Less ergonomic.
- Unnecessary inheritance.

**Decision**

Rejected.

---

## Object + Helper

```ts
tool({
    ...
})
```

**Pros**

- Excellent type inference.
- Minimal boilerplate.
- Consistent API.
- Easy validation.
- Extensible.

**Decision**

Accepted.

---

# Relationship with Runtime

```
Agent

↓

Tool Registry

↓

Runtime

↓

Tool

↓

Result

↓

Runtime
```

The Runtime owns execution.

The Tool owns business logic.

This separation keeps the SDK modular and predictable.

---

# Future Considerations

The current Tool API focuses on request-response execution.

Future versions may introduce:

- Streaming Tools
- Long-running Tools
- Human approval
- Distributed execution
- Remote MCP-compatible Tools

These should build upon the same Tool abstraction rather than replacing it.

---

# Final Decision

Agni SDK adopts an immutable, provider-agnostic Tool abstraction.

A Tool describes a capability through metadata, an input schema, and an execution function.

The Runtime is responsible for deciding **when** a Tool executes, while the Tool is responsible only for **how** the requested operation is performed.

This separation creates a simple, type-safe, and extensible foundation for production-grade agent tooling.
