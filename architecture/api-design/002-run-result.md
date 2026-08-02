# 002 — Run Result

**Status:** Draft  
**Phase:** API Design  
**Component:** Runtime API  
**Owner:** Agni SDK

---

# Overview

Run Result defines the output contract returned by the Agni execution engine.

Every agent execution produces a result that represents:

- Successful completion.
- Expected execution failures.
- Runtime metadata.

The goal is to provide a predictable and type-safe API for developers.

---

# Design Decision

Agni uses a **Result-based execution model**.

The `run()` function does not throw for expected agent execution outcomes.

Instead, it returns a discriminated union.

---

# Why Result Instead Of Throwing?

Agent execution contains many situations that are not exceptional failures.

Examples:

- Guardrail blocked a response.
- Maximum turns reached.
- Tool execution failed.
- Input validation failed.
- User cancelled execution.

These are normal runtime states.

Forcing developers to handle them with:

```ts
try {
} catch {}
```

creates poor developer experience.

---

# Result Model

The base result:

```ts
type RunResult<TOutput> = RunSuccess<TOutput> | RunFailure;
```

---

# Successful Run

Example:

```ts
{
  success: true,

  output: "The answer is 42"
}
```

---

Type:

```ts
interface RunSuccess<TOutput> {
  success: true;

  output: TOutput;

  runId: string;
}
```

---

# Successful Result Properties

## success

Indicates execution completed successfully.

```ts
success: true;
```

---

## output

Final agent response.

Example:

```ts
output: 'The weather is sunny.';
```

---

## runId

Unique identifier for the execution.

Example:

```ts
runId: 'run_123';
```

Used for:

- Debugging.
- Observability.
- Tracing.
- Support.

---

# Failed Run

Example:

```ts
{
 success:false,

 error:{
   type:"max_turns",
   message:
   "Maximum turns exceeded"
 }
}
```

---

Type:

```ts
interface RunFailure {
  success: false;

  error: RunError;

  runId: string;
}
```

---

# Error Model

Errors are structured.

```ts
interface RunError {
  type: string;

  message: string;

  details?: unknown;
}
```

---

# Error Categories

---

# 001 — Guardrail Error

## Example

Input violates safety rules.

```ts
{
 type:"guardrail_blocked",

 message:
 "Input rejected by guardrail"
}
```

---

# 002 — Max Turns Error

## Example

Agent exceeded execution limit.

```ts
{
 type:"max_turns_exceeded",

 message:
 "Agent exceeded maximum turns"
}
```

---

# 003 — Tool Execution Error

## Example

Tool failed.

```ts
{
 type:"tool_error",

 message:
 "Weather API unavailable"
}
```

---

# 004 — Provider Error

## Example

Model provider failure.

```ts
{
 type:"provider_error",

 message:
 "Provider request failed"
}
```

---

# 005 — Validation Error

## Example

Invalid input.

```ts
{
 type:"validation_error",

 message:
 "Invalid tool arguments"
}
```

---

# 006 — Cancellation Error

## Example

User cancelled execution.

```ts
{
 type:"cancelled",

 message:
 "Run cancelled"
}
```

---

# Retry Information

Errors may include retry metadata.

Example:

```ts
{
 type:"provider_error",

 retryable:true,

 retryAfter:5000
}
```

---

Type:

```ts
interface RunError {
  type: string;

  message: string;

  retryable?: boolean;

  retryAfter?: number;

  details?: unknown;
}
```

---

# Error Handling Flow

```
Execution Event

       |

       ↓

Error Classification

       |

       +----------------+

       |                |

 Expected          Unexpected

       |                |

       ↓                ↓

RunFailure        Throw Error

```

---

# Unexpected Exceptions

Not every error becomes a RunFailure.

Example:

```ts
throw new Error('Internal SDK bug');
```

---

Unexpected exceptions include:

- Framework bugs.
- Invalid internal state.
- Programming errors.

These should surface immediately.

---

# Generic Output Support

Run Result supports custom outputs.

Example:

```ts
Agent<WeatherResponse>;
```

returns:

```ts
RunResult<WeatherResponse>;
```

---

Example:

```ts
interface WeatherResponse {
  city: string;

  temperature: string;
}
```

---

# TypeScript Usage

Example:

```ts
const result = await run(agent, input);

if (result.success) {
  console.log(result.output);
} else {
  console.log(result.error.type);
}
```

---

# Why Discriminated Union?

Because TypeScript can automatically narrow.

Example:

```ts
if (result.success) {
  // output exists
} else {
  // error exists
}
```

No:

```ts
as Error
```

required.

---

# Metadata

Future metadata support:

```ts
{
 success:true,

 output:"hello",

 metadata:{
   tokens:120,
   duration:500
 }
}
```

Possible metadata:

- Token usage.
- Execution time.
- Provider information.
- Tool calls.

---

# Streaming Compatibility

The Result model is also compatible with streaming.

Streaming:

```
Run Started

↓

Events

↓

Final RunResult
```

The final completion still returns:

```ts
RunResult;
```

---

# Final API Contract

The public contract:

```ts
type RunResult<T> =
  | {
      success: true;

      output: T;

      runId: string;
    }
  | {
      success: false;

      error: RunError;

      runId: string;
    };
```

---

# Final Decision

Agni SDK uses a Result-based execution model.

Expected execution outcomes are represented as data.

Exceptions are reserved for unexpected failures.

This keeps agent execution predictable, type-safe, and production friendly.
