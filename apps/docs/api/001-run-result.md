# 001 — Run Result

**Status:** Draft  
**Phase:** API Design  
**Owner:** Agni SDK

---

# Overview

Every execution of an Agent produces a **Run Result**.

A Run Result is the public contract returned by the Runtime after an execution finishes.

It represents the final outcome of a run, regardless of whether the execution completed successfully, was interrupted, or ended due to an expected runtime condition.

The Run Result is one of the most important APIs in Agni SDK because it is the primary interface between the Runtime and the application.

---

# Goals

The Run Result should:

- Represent every possible execution outcome.
- Avoid using exceptions for expected runtime behavior.
- Provide enough information for applications to make decisions.
- Remain stable as new Runtime capabilities are added.
- Be provider-agnostic.
- Be easy to understand for beginners while remaining extensible.

---

# Design Principles

## 1. Execution Produces a Result

A Runtime execution should always produce a result.

Applications should inspect the result instead of relying on exceptions for normal execution flow.

Example:

```ts
const result = await run(agent, input);

if (result.status === 'completed') {
  console.log(result.output);
}
```

---

## 2. Expected Outcomes Are Not Exceptions

Many agent execution outcomes are expected.

Examples include:

- Guardrail blocked the request.
- Maximum turn limit reached.
- User cancelled the execution.
- Provider returned an expected failure.
- Tool execution failed.

These are runtime outcomes rather than programming errors.

Returning a structured result makes these situations explicit and easier to handle.

---

## 3. Exceptions Are Reserved for Framework Errors

The Runtime should only throw when something unexpected happens.

Examples include:

- Internal SDK bug.
- Invalid Runtime state.
- Broken Provider implementation.
- Corrupted internal data.
- Violated framework invariants.

These indicate a defect rather than an execution outcome.

---

# Execution Status

A Run Result always contains a status describing how the execution finished.

Initial statuses:

| Status           | Description                                   |
| ---------------- | --------------------------------------------- |
| `completed`      | Agent successfully produced a final response. |
| `blocked`        | Execution was stopped by a Guardrail.         |
| `max_turns`      | Maximum Runtime turns were reached.           |
| `cancelled`      | Execution was cancelled by the caller.        |
| `provider_error` | Provider returned an execution failure.       |
| `tool_error`     | Tool execution failed.                        |

Additional statuses may be introduced in future versions without changing the overall API shape.

---

# Proposed Public API

```ts
type RunStatus =
  'completed' | 'blocked' | 'max_turns' | 'cancelled' | 'provider_error' | 'tool_error';

interface RunResult<TOutput = string> {
  status: RunStatus;

  output?: TOutput;

  error?: AgniError;

  turns: number;

  usage?: TokenUsage;
}
```

This represents the conceptual API.

The final implementation may evolve while preserving the same developer experience.

---

# Usage Examples

## Successful Execution

```ts
const result = await run(agent, 'Explain TypeScript.');

if (result.status === 'completed') {
  console.log(result.output);
}
```

---

## Guardrail Block

```ts
const result = await run(agent, dangerousPrompt);

if (result.status === 'blocked') {
  console.log('Request blocked.');
}
```

---

## Maximum Turns

```ts
const result = await run(agent, prompt);

if (result.status === 'max_turns') {
  console.log('Execution exceeded maximum turns.');
}
```

---

## Provider Failure

```ts
const result = await run(agent, prompt);

if (result.status === 'provider_error') {
  console.log(result.error);
}
```

---

# Why Not Throw Exceptions?

An agent Runtime is not equivalent to a normal function.

Many execution outcomes are expected parts of the execution lifecycle.

Example:

```text
User

↓

Runtime

↓

Guardrail

↓

Blocked
```

The Runtime behaved correctly.

Throwing an exception would incorrectly suggest that something went wrong.

Returning a structured result communicates that the execution completed with a known outcome.

---

# Why Not Use `success: boolean`?

A boolean provides insufficient information.

Example:

```ts
{
  success: false;
}
```

The caller still needs to determine why the execution failed.

Using explicit statuses improves readability and scalability.

Example:

```ts
switch (result.status) {
  case 'completed':
    break;

  case 'blocked':
    break;

  case 'max_turns':
    break;
}
```

This approach remains clear as additional execution states are introduced.

---

# Extensibility

Future Runtime features may add additional metadata without changing the overall API structure.

Potential additions include:

- Execution duration.
- Token usage details.
- Cost estimation.
- Trace identifiers.
- Session identifiers.
- Memory statistics.
- Provider metadata.

Because these are additive, existing applications remain compatible.

---

# Alternatives Considered

## Throw Exceptions

**Pros**

- Familiar JavaScript pattern.
- Simple API.

**Cons**

- Expected Runtime outcomes become exceptions.
- Encourages excessive try/catch usage.
- Makes control flow less explicit.

**Decision**

Rejected.

---

## Boolean Success Flag

Example:

```ts
{
  success: true,
  output: "..."
}
```

**Pros**

- Very simple.

**Cons**

- Cannot distinguish different execution outcomes.
- Poor scalability.
- Less expressive.

**Decision**

Rejected.

---

## Status-Based Result

Example:

```ts
{
  status: "completed",
  output: "..."
}
```

**Pros**

- Explicit.
- Extensible.
- Type-safe.
- Easy to pattern match.
- Suitable for long-running agent workflows.

**Decision**

Accepted.

---

# Future Considerations

The current Run Result focuses on non-streaming execution.

Future versions may introduce:

- Streaming result types.
- Partial outputs.
- Event-driven execution.
- Multi-agent execution summaries.

These should build upon the same conceptual Run Result model rather than replacing it.

---

# Final Decision

Agni SDK adopts a **status-based Run Result**.

The Runtime returns a structured result representing the execution outcome.

Exceptions are reserved for unexpected framework failures rather than expected agent execution behavior.

This design provides a stable, expressive, and extensible public API suitable for production-grade AI agent applications.
