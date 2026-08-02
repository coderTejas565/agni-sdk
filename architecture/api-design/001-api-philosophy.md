# 001 — API Philosophy

**Status:** Draft  
**Phase:** API Design  
**Component:** Public SDK API  
**Owner:** Agni SDK

---

# Overview

This document defines the design philosophy behind the Agni SDK public API.

The API is the primary product surface of the framework.

The goal is to create an API that is:

- Simple for beginners.
- Powerful for advanced users.
- Type-safe.
- Provider-independent.
- Explicit.
- Extensible without breaking changes.

The API should allow developers to start with a minimal agent and progressively adopt advanced capabilities.

---

# Core Design Principles

---

# Principle 001 — Configuration And Execution Are Separate

## Decision

Agent configuration and agent execution are different concepts.

An Agent defines:

- Identity.
- Instructions.
- Model.
- Tools.
- Capabilities.

A Run represents:

- A single execution.
- Runtime state.
- Context.
- Messages.
- Tool calls.
- Results.

---

## Example

Agent:

```ts
const agent = new Agent({
  instructions: 'You are a helpful assistant',

  model: gemini('gemini-2.5-flash'),
});
```

Execution:

```ts
const result = await run(agent, 'Explain TypeScript');
```

---

## Reason

The same agent can execute multiple times.

Example:

```
Agent

   |
   +---- Run 1
   |
   +---- Run 2
   |
   +---- Run 3
```

Runtime state should never leak into the Agent definition.

---

# Principle 002 — Explicit Over Magic

## Decision

Agni prefers explicit configuration over hidden behavior.

Developers should understand:

- Which model is used.
- Which tools are available.
- Which context is passed.
- Which capabilities are enabled.

---

## Avoid

Example:

```ts
createAgent('assistant');
```

where the framework secretly decides:

- Model.
- Tools.
- Memory.
- Behavior.

---

## Prefer

```ts
new Agent({
  model,
  instructions,
  tools,
});
```

---

## Reason

Explicit APIs improve:

- Debugging.
- Learning.
- Production reliability.

---

# Principle 003 — Agents Are Immutable

## Decision

Agent configuration should not mutate after creation.

Example:

```ts
const agent = new Agent({
  model,
  tools,
});
```

The Agent remains unchanged.

---

## Reason

Immutability provides:

- Predictable behavior.
- Easier debugging.
- Safe reuse.
- Clear lifecycle.

---

## Override Requirement

Immutable does not mean inconvenient.

Agni should support cloning.

Example:

```ts
const fastAgent = agent.clone({
  model: anotherModel,
});
```

The original agent remains unchanged.

```
Original Agent

       |
       |
       +---- Clone

```

---

# Principle 004 — TypeScript First

## Decision

Agni is designed around TypeScript.

The API should provide:

- Strong typing.
- Generic context support.
- Typed tools.
- Typed results.

---

## Example

```ts
const agent = new Agent<UserContext>({
  instructions: 'Assistant',
});
```

---

## Reason

Agent frameworks contain complex workflows.

Strong types prevent runtime errors.

---

# Principle 005 — Async Friendly Extensions

## Decision

Framework extensions support both synchronous and asynchronous implementations.

---

## Example

Tool:

```ts
execute(
 input
):
 Output | Promise<Output>
```

---

Valid:

```ts
execute(){
 return "hello";
}
```

---

Also valid:

```ts
async execute(){
 return await database.query();
}
```

---

## Reason

Simple extensions should remain simple.

Complex operations should support async workflows.

---

# Principle 006 — Composition Over Configuration Explosion

## Decision

Features should be composable.

Agni should avoid a single configuration object containing every possible feature.

---

Avoid:

```ts
new Agent({
  memory: true,

  guardrails: true,

  tracing: true,

  retries: true,

  streaming: true,
});
```

---

Prefer:

```ts
new Agent({
  tools,

  model,

  instructions,
});
```

with optional extensions.

---

Example:

```ts
agent.withMemory(memory);

agent.withGuardrails(rules);
```

---

# Principle 007 — Provider Agnostic Public API

## Decision

The public API should not expose provider-specific concepts.

Users should not write:

```ts
geminiFunctionCall;
```

or:

```ts
openAIToolCall;
```

---

Instead:

```ts
toolCall;
```

belongs to Agni.

---

## Architecture

```
Application

↓

Agni API

↓

Provider Adapter

↓

AI Provider
```

---

# Provider Escape Hatch

Provider abstraction should not block advanced users.

Agni supports provider-specific options.

Example:

```ts
new Agent({
  model,

  providerOptions: {
    gemini: {
      safetySettings: [],
    },
  },
});
```

---

# Principle 008 — Internal Details Stay Private

## Decision

The public API exposes stable contracts.

Internal implementation can evolve.

---

Public:

```ts
run(agent, input);
```

---

Internal:

```
Runtime

Tool Registry

Provider Adapter

Event System
```

---

Users should not depend on:

- Internal classes.
- Internal state.
- Internal execution flow.

---

# Principle 009 — Progressive Disclosure

## Decision

Simple use cases should require minimal configuration.

Advanced features should be opt-in.

---

## Beginner Usage

```ts
const agent = new Agent({
  model,
});

await run(agent, 'hello');
```

---

## Advanced Usage

```ts
await run(agent, input, {
  context,
  signal,
  tracing,
  memory,
});
```

---

## Rule

Every advanced feature must have a sensible default.

Examples:

```
Memory

default:
disabled


Tracing

default:
no-op


Guardrails

default:
none
```

---

# Principle 010 — Typed Run Context

## Decision

Request-specific data flows through RunContext.

Examples:

- User information.
- Authentication.
- Database clients.
- Request metadata.

---

Example:

```ts
run(
  agent,

  input,

  {
    context: userContext,
  },
);
```

---

Tools receive:

```ts
execute(input, context);
```

---

## Reason

Avoid:

- Global variables.
- Hidden dependencies.
- Closures.

---

# Principle 011 — Result Based Execution Errors

## Decision

Expected execution failures return Result objects.

---

Example:

```ts
{
 success:true,

 output:"hello"
}
```

---

Failure:

```ts
{
 success:false,

 error:{
   type:"max_turns"
 }
}
```

---

## Expected failures:

- Guardrail rejection.
- Max turns reached.
- Validation failure.
- Tool failure.

---

## Exceptions Reserved For

Unexpected failures:

- SDK bugs.
- Invalid internal state.
- Infrastructure crashes.

---

# Principle 012 — Cancellation Support

## Decision

Long-running executions support cancellation.

---

Example:

```ts
const controller = new AbortController();

run(agent, input, {
  signal: controller.signal,
});
```

---

Supported operations:

- Provider requests.
- Streaming.
- Tool execution.

---

# Final API Philosophy

Agni SDK follows these rules:

```
Simple by default

↓

Explicit configuration

↓

Strong typing

↓

Provider independence

↓

Composable extensions

↓

Advanced control when required
```

The public API should feel simple on the surface while maintaining a production-grade internal architecture.

---

# Final Decision

The Agni API will be designed around:

```
Agent

+

Run

+

RunContext

+

Tools

+

Providers

+

Result Based Execution
```

All future API decisions must follow these principles.
