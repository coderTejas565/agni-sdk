# 009 — Errors

**Status:** Draft  
**Phase:** API Design  
**Component:** Error Handling API  
**Owner:** Agni SDK

---

# Overview

Error handling defines how Agni communicates failures during agent execution.

Agent systems contain many failure scenarios:

- Provider failures.
- Tool failures.
- Validation failures.
- Guardrail rejections.
- Runtime limits.
- User cancellation.

A production SDK must clearly distinguish between:

- Expected execution outcomes.
- Unexpected programming failures.

---

# Design Decision

Agni follows a two-layer error model.

```
Expected Execution Failures

        ↓

RunResult Failure


Unexpected System Failures

        ↓

Thrown Exceptions

```

---

# Why Two Error Categories Exist

Not every failure is exceptional.

Example:

A guardrail blocking a response is an expected runtime decision.

It should not require:

```ts
try {
} catch {}
```

---

But an internal SDK bug should immediately stop execution.

Example:

```ts
undefined.method();
```

This should throw.

---

# Error Categories

Agni errors are divided into:

```
Execution Errors

+

System Errors

```

---

# 001 — Execution Errors

Execution errors happen during normal Agent operation.

They are returned through:

```ts
RunResult;
```

---

Examples:

- Tool failure.
- Provider timeout.
- Guardrail rejection.
- Maximum turns exceeded.
- Validation failure.

---

Example:

```ts
{
 success:false,

 error:{
   type:"tool_error",

   message:
   "Weather service unavailable"
 }
}
```

---

# 002 — System Errors

System errors indicate unexpected problems.

They are thrown.

Examples:

- SDK internal bug.
- Invalid framework state.
- Corrupted configuration.
- Programming errors.

---

Example:

```ts
throw new AgniInternalError('Runtime state invalid');
```

---

# Error Interface

Conceptual type:

```ts
interface AgniError {
  type: string;

  message: string;

  cause?: unknown;

  metadata?: Record<string, unknown>;
}
```

---

# Error Properties

---

# Type

Identifies the error category.

Example:

```ts
type: 'provider_error';
```

---

# Message

Human-readable explanation.

Example:

```ts
message: 'Provider request failed';
```

---

# Cause

Original error.

Example:

```ts
cause: originalException;
```

---

# Metadata

Additional debugging information.

Example:

```ts
metadata:{
 provider:"gemini",

 retryCount:2
}
```

---

# Execution Error Types

---

# Provider Error

## Purpose

Represents AI provider failures.

Examples:

- API unavailable.
- Rate limit.
- Timeout.
- Invalid response.

---

Example:

```ts
{
 type:"provider_error",

 provider:"gemini",

 message:
 "Request timeout"
}
```

---

# Tool Error

## Purpose

Represents tool execution failures.

Example:

```ts
{
 type:"tool_error",

 toolName:
 "search_database",

 message:
 "Database unavailable"
}
```

---

# Validation Error

## Purpose

Represents invalid data.

Examples:

- Invalid tool arguments.
- Invalid user input.
- Schema mismatch.

---

Example:

```ts
{
 type:"validation_error",

 field:"city",

 message:
 "Expected string"
}
```

---

# Guardrail Error

## Purpose

Represents safety or policy rejection.

Example:

```ts
{
 type:"guardrail_blocked",

 message:
 "Request blocked"
}
```

---

# Max Turns Error

## Purpose

Protects against infinite loops.

Example:

```ts
{
 type:"max_turns_exceeded",

 turns:10
}
```

---

# Cancellation Error

## Purpose

Represents user cancellation.

Example:

```ts
{
 type:"cancelled",

 message:
 "Execution cancelled"
}
```

---

# Retry Support

Errors may contain retry information.

Example:

```ts
{
 type:"provider_error",

 retryable:true,

 retryAfter:5000
}
```

---

Interface:

```ts
interface RetryMetadata {
  retryable: boolean;

  retryAfter?: number;
}
```

---

# Error Flow

Complete execution:

```
User Input

↓

Runtime

↓

Provider

↓

Tool

↓

Error Occurs

↓

Classify Error

↓

+----------------+

|                |

Expected       Unexpected

|                |

↓                ↓

RunResult       Throw

Failure         Exception

```

---

# Tool Error Handling

Tools should not decide runtime behavior.

Example:

Tool:

```ts
execute(){

 throw new Error(
  "API failed"
 );

}
```

---

Runtime decides:

Possible actions:

- Retry.
- Send error to model.
- Fail run.

---

# Provider Error Handling

Provider adapters normalize external errors.

Example:

Gemini:

```
429 RESOURCE_EXHAUSTED
```

---

Converted:

```ts
{
 type:"provider_error",

 retryable:true
}
```

---

The Runtime remains provider-independent.

---

# Error Serialization

Errors should be serializable.

Reason:

Needed for:

- Logs.
- Observability.
- Distributed execution.
- Debugging.

---

Example:

```json
{
  "type": "tool_error",
  "message": "API failed"
}
```

---

# Error Security

Agni should avoid exposing sensitive data.

Never include:

- API keys.
- Tokens.
- Database credentials.
- Private context.

---

Bad:

```ts
message: 'Failed using token xyz';
```

---

Good:

```ts
message: 'Authentication failed';
```

---

# Error Events In Streaming

Streaming uses the same error model.

Example:

```ts
{
 type:"run_error",

 error:{
   type:"provider_error"
 }
}
```

---

# Developer Experience

Simple:

```ts
const result = await run(agent, input);

if (!result.success) {
  console.log(result.error.message);
}
```

---

Advanced:

```ts
switch (result.error.type) {
  case 'tool_error':
    break;

  case 'provider_error':
    break;
}
```

---

# Future Extensions

Possible future error categories:

- Approval required.
- Memory unavailable.
- Handoff failed.
- Budget exceeded.
- Timeout.

---

# Final API Contract

Expected failures:

```ts
RunResult<Output>

{
 success:false,

 error:AgniError
}
```

---

Unexpected failures:

```ts
throw AgniError;
```

---

# Final Decision

Agni separates execution failures from system failures.

Expected runtime conditions are returned as structured results.

Unexpected framework failures throw exceptions.

This provides:

- Better developer experience.
- Type-safe handling.
- Predictable execution.
- Production-grade debugging.

Error handling is a foundational part of the Agni SDK API contract.
