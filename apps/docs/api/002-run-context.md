# 002 — Run Context

**Status:** Draft  
**Phase:** API Design  
**Owner:** Agni SDK

---

# Overview

Every Agent execution occurs within a **Run Context**.

A Run Context represents the execution environment for a single invocation of the Runtime.

It contains all request-scoped information required during execution and is shared across every Runtime component.

Unlike an Agent, which represents static configuration, a Run Context exists only for the lifetime of a single execution.

---

# Why Does Run Context Exist?

An Agent describes **what** should happen.

A Run Context describes **what is happening right now**.

Example:

```ts
const agent = new Agent({
  instructions: 'You are a helpful assistant.',
  model: gemini(),
});
```

The Agent remains the same across every execution.

However, every invocation is different.

```ts
await run(agent, inputA);
await run(agent, inputB);
await run(agent, inputC);
```

Each execution has:

- Different user data
- Different execution ID
- Different cancellation signal
- Different metadata
- Different Runtime state

This information belongs to the Run Context rather than the Agent.

---

# Goals

The Run Context should:

- Represent a single execution.
- Carry request-scoped application data.
- Be available to every Runtime component.
- Remain provider-agnostic.
- Support future Runtime capabilities without breaking APIs.
- Keep Agent configuration immutable.

---

# Design Principles

## 1. Execution-Scoped

A Run Context exists only while a Runtime is executing.

Example:

```text
Run Started

↓

Create Run Context

↓

Runtime Execution

↓

Destroy Run Context
```

It is never reused across multiple executions.

---

## 2. Shared Across the Entire Runtime

Every component participating in execution should receive the same Run Context.

```text
Application

↓

run()

↓

Runtime

├── Provider
├── Tool Registry
├── Memory
├── Guardrails
└── Observability
```

This guarantees every component has access to the same execution information.

---

## 3. Separates Static and Dynamic Data

Static information belongs to the Agent.

Dynamic information belongs to the Run Context.

### Agent

- Instructions
- Model
- Tools
- Memory configuration
- Guardrails

### Run Context

- Current user
- Request metadata
- Cancellation signal
- Execution identifiers
- Runtime services

This separation keeps Agents reusable and predictable.

---

## 4. Strongly Typed

Applications should be able to define their own context type.

Example:

```ts
type AppContext = {
  userId: string;
  db: Database;
  organizationId: string;
};
```

The SDK should preserve these types throughout execution.

---

## Proposed Public API

```ts
interface RunContext<TContext = unknown> {
  /**
   * Application-specific request context.
   */
  context: TContext;

  /**
   * Unique execution identifier.
   */
  runId: string;

  /**
   * Used to cancel execution.
   */
  signal: AbortSignal;

  /**
   * Additional execution metadata.
   */
  metadata: Record<string, unknown>;
}
```

This represents the conceptual API.

The internal implementation may evolve while preserving the same developer experience.

---

# Context Flow

```text
Application

↓

run(agent, input, {
    context
})

↓

Runtime

↓

RunContext

↓

Provider

↓

Tool Registry

↓

Tools

↓

Memory

↓

Guardrails

↓

Observability
```

The Runtime creates a single Run Context and shares it with every component.

---

# Usage Examples

## Passing Application Context

```ts
type AppContext = {
  userId: string;
  db: Database;
};

await run(agent, prompt, {
  context: {
    userId,
    db,
  },
});
```

---

## Accessing Context Inside a Tool

```ts
tool<AppContext>({
  async execute(input, ctx) {
    const user = ctx.context.userId;

    await ctx.context.db.users.find(user);
  },
});
```

---

## Accessing Context Inside Memory

```ts
memory.retrieve(query, ctx);
```

Memory implementations can use the same context without depending on application globals.

---

## Accessing Context Inside Guardrails

```ts
guardrail.validate(message, ctx);
```

Guardrails receive the same execution context as Tools and Memory.

---

# Why Not Use Global Variables?

Global state introduces several problems:

- Difficult testing
- Hidden dependencies
- Shared mutable state
- Reduced portability
- Poor composability

Passing a Run Context explicitly keeps dependencies visible and predictable.

---

# Why Not Store Context on the Agent?

The Agent represents reusable configuration.

Context changes for every execution.

Example:

```ts
const agent = new Agent(...);

await run(agent, inputA, {
  context: userA,
});

await run(agent, inputB, {
  context: userB,
});
```

Embedding request-specific data inside the Agent would make Agents stateful and harder to reuse.

---

# Extensibility

Future Runtime features can extend the Run Context without changing existing APIs.

Possible additions include:

- Logger
- Tracer
- Session
- Memory Manager
- Event Bus
- Provider Information
- Execution Statistics
- Retry Information

Because components already depend on Run Context, these additions can remain backward compatible.

---

# Alternatives Considered

## Global Application State

**Pros**

- Easy to access.

**Cons**

- Hidden dependencies.
- Difficult testing.
- Poor isolation.

**Decision**

Rejected.

---

## Closures

Example:

```ts
const db = createDatabase();

tool({
  execute() {
    db.query(...);
  },
});
```

**Pros**

- Simple for small applications.

**Cons**

- Difficult to compose.
- Harder to test.
- Does not scale across Runtime components.

**Decision**

Rejected.

---

## Typed Run Context

Example:

```ts
run(agent, input, {
  context: appContext,
});
```

**Pros**

- Explicit.
- Type-safe.
- Request-scoped.
- Easy to test.
- Shared consistently across the Runtime.

**Decision**

Accepted.

---

# Relationship with the Agent

The Agent defines the execution plan.

The Run Context defines the execution environment.

```text
Agent
(Static Configuration)

        +

Run Context
(Dynamic Execution State)

        ↓

Runtime Execution
```

Neither replaces the other.

They work together to produce a single execution.

---

# Future Considerations

The current design intentionally keeps the Run Context lightweight.

Future versions may introduce additional Runtime-managed services, but these should be exposed through the same Run Context abstraction rather than introducing separate context mechanisms.

This preserves a single, consistent execution model across the SDK.

---

# Final Decision

Agni SDK adopts a **typed Run Context** as the execution-scoped environment for every Runtime invocation.

The Run Context carries application-specific request data together with Runtime metadata and is shared consistently across Providers, Tools, Memory, Guardrails, and Observability.

This design provides a flexible, type-safe, and extensible foundation for production-grade AI agent execution while keeping Agent configuration immutable and reusable.
