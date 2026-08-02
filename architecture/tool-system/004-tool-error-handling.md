# 004 — Tool Error Handling

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Tool System  
**Owner:** Agni SDK

---

# Overview

Tool Error Handling defines how Agni SDK manages failures that occur during Tool execution.

Tools interact with external systems:

- APIs
- Databases
- File systems
- Third-party services
- Internal application logic

Because these systems can fail, Tool execution requires a predictable error strategy.

The goal is:

- Prevent unexpected runtime crashes.
- Provide meaningful feedback to the model.
- Allow applications to handle failures.
- Maintain execution observability.

---

# Core Principle

Tools are responsible for reporting failures.

The Runtime is responsible for deciding what happens next.

```
Tool

↓

Error

↓

Runtime Policy

↓

Recovery Decision
```

A Tool should never decide:

- Retry count.
- Whether execution continues.
- Whether the model should recover.
- Whether the run should terminate.

---

# Error Categories

Agni separates Tool errors into different categories.

```
Tool Error

├── Expected Error
│
└── Unexpected Error
```

---

# 1. Expected Tool Errors

Expected errors are failures that can happen during normal operation.

Examples:

- API unavailable.
- Invalid user input.
- Resource not found.
- Permission denied.
- External service timeout.

Example:

```ts
throw new ToolError({
  type: 'not_found',

  message: 'User does not exist.',
});
```

These errors should be handled by Runtime policies.

---

# 2. Unexpected Tool Errors

Unexpected errors indicate programming or infrastructure issues.

Examples:

- Null pointer.
- Broken implementation.
- Internal bug.

Example:

```ts
throw new Error('Cannot read property id');
```

These should usually terminate execution.

---

# Error Flow

```
Tool Execution

↓

Tool throws error

↓

Runtime catches

↓

Classify error

↓

Apply policy

↓

Continue / Retry / Fail
```

---

# Tool Error Object

Agni should provide a standard error format.

Conceptually:

```ts
interface ToolError {
  type:
    'validation' | 'not_found' | 'permission_denied' | 'timeout' | 'rate_limit' | 'external_error';

  message: string;

  retryable?: boolean;

  metadata?: Record<string, unknown>;
}
```

---

# Why Standard Errors?

Without normalization:

Example:

Tool A:

```ts
throw Error('failed');
```

Tool B:

```ts
throw {
  errorCode: 500,
};
```

Tool C:

```ts
return {
  status: false,
};
```

The Runtime cannot reliably handle failures.

Standard errors provide:

- Consistency.
- Better recovery.
- Better observability.

---

# Runtime Error Handling Flow

Example:

Weather API fails.

```
User

↓

Runtime

↓

Weather Tool

↓

Weather API

↓

Failure

↓

Runtime

↓

Error Policy

↓

Decision
```

---

# Recovery Strategies

The Runtime may apply different strategies.

---

# Strategy 1 — Retry

Used when failures may be temporary.

Examples:

- Rate limit.
- Network timeout.
- Temporary outage.

Flow:

```
Tool Failure

↓

Check Retry Policy

↓

Retry

↓

Success
```

Example:

```ts
retry: {
  attempts: 3;
}
```

---

# Strategy 2 — Return Error To Model

Useful when the model can recover.

Example:

Tool:

```json
{
  "error": "Calendar service unavailable"
}
```

Model:

```
"I cannot access calendar right now."
```

Flow:

```
Tool Error

↓

Provider

↓

Model

↓

Recovery Response
```

---

# Strategy 3 — Fail The Run

Used for unrecoverable errors.

Examples:

- Authentication failure.
- Invalid configuration.
- Security violation.

Result:

```ts
{
 success:false,

 error:{
  type:"tool_failure"
 }
}
```

---

# Retry Policy

Retry decisions belong to Runtime.

Not:

```
Tool

↓

Retry
```

Correct:

```
Tool

↓

Runtime Retry Policy
```

Reason:

The Runtime understands:

- Current turn.
- Previous attempts.
- Cost.
- Time limits.

---

# Timeout Handling

Tools may run longer than expected.

Example:

```
Tool Started

↓

10 seconds passed

↓

Timeout

↓

Runtime handles
```

Possible result:

```ts
{
 type:"timeout",

 message:
 "Tool execution exceeded limit"
}
```

---

# Cancellation

Tools should support cancellation.

Flow:

```
User

↓

AbortSignal

↓

Runtime

↓

Tool

↓

External Request
```

Example:

```ts
execute(input, {
  signal,
});
```

---

# Error Sent Back To Model

When Runtime decides recovery is possible:

```
Tool

↓

Error

↓

Runtime

↓

Provider

↓

Model
```

The model receives:

```json
{
  "tool": "weather",

  "error": {
    "message": "Weather service unavailable"
  }
}
```

The model can decide next action.

---

# Tool Error Lifecycle

```
CREATED

↓

EXECUTING

↓

FAILED

↓

CLASSIFY_ERROR

↓

APPLY_POLICY

↓

RETRY

      OR

RETURN_TO_MODEL

      OR

FAIL_RUN

↓

COMPLETED
```

---

# Sequence Diagram

```
Runtime

 |

 | execute()

 ↓

Tool

 |

 | API Call

 ↓

External Service

 |

 | Error

 ↓

Tool

 |

 | throw ToolError

 ↓

Runtime

 |

 | classify

 ↓

Error Policy

 |

 +------------+
 |            |
Retry     Fail Run
 |
 |
Tool
```

---

# Security Considerations

Tool errors may contain sensitive information.

Example:

Bad:

```json
{
  "error": "Database password incorrect"
}
```

Good:

```json
{
  "error": "Database unavailable"
}
```

Runtime should control:

- Error exposure.
- Logging.
- User visibility.

---

# Observability Integration

Every failure should generate events.

Example:

```
tool.started

↓

tool.failed

↓

tool.retry

↓

tool.completed
```

These events allow:

- Debugging.
- Metrics.
- Cost tracking.
- Reliability monitoring.

---

# Alternatives Considered

## Let Tools Handle Retries

Rejected.

Reason:

Different tools would implement different retry strategies.

---

## Always Throw Errors

Rejected.

Reason:

Expected failures are part of agent execution.

Example:

- Tool unavailable.
- Guardrail rejection.

They should not always become exceptions.

---

## Always Send Errors To Model

Rejected.

Reason:

Some failures should never reach the model.

Examples:

- Security errors.
- Internal bugs.

---

# Final Decision

Agni SDK uses a Runtime-controlled Tool Error Handling system.

Architecture:

```
Tool

↓

Standard Tool Error

↓

Runtime Error Policy

↓

Retry

OR

Model Recovery

OR

Run Failure
```

Tools report failures.

Runtime decides recovery.

This keeps Tool implementations simple while enabling production-grade reliability.
