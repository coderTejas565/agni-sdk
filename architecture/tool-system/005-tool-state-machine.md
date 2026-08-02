# 005 — Tool State Machine

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Tool System  
**Owner:** Agni SDK

---

# Overview

The Tool State Machine defines the lifecycle of a Tool during Agent execution.

A Tool moves through different states from registration until completion.

The state machine provides:

- Predictable execution behavior.
- Clear transition rules.
- Better error handling.
- Observability points.
- Easier debugging.

---

# Why State Machine?

Without explicit states, tool execution becomes:

```
call tool()

↓

maybe success

↓

maybe error

↓

continue somehow
```

This becomes difficult when adding:

- Retries.
- Timeouts.
- Cancellation.
- Approval workflows.
- Observability.
- Human-in-the-loop execution.

A state machine makes every transition explicit.

---

# Tool Lifecycle

High-level lifecycle:

```
REGISTERED

↓

AVAILABLE

↓

REQUESTED

↓

VALIDATING

↓

EXECUTING

↓

COMPLETED
```

Failure paths:

```
EXECUTING

↓

FAILED

↓

RETRYING

↓

EXECUTING
```

or:

```
FAILED

↓

TERMINATED
```

---

# States

---

# 1. CREATED

## Description

Tool instance exists in memory.

Example:

```ts
const weatherTool = {
 name:"weather",
 execute()
}
```

At this point:

- Tool is not attached to an Agent.
- Tool cannot execute.

State:

```
CREATED
```

---

# 2. REGISTERED

## Description

Tool has been added to an Agent configuration.

Example:

```ts
new Agent({
  tools: [weatherTool],
});
```

Transition:

```
CREATED

↓

REGISTERED
```

Validation:

- Name exists.
- Schema exists.
- Execute function exists.

---

# 3. AVAILABLE

## Description

Runtime has created the Tool Registry and the Tool can participate in execution.

Flow:

```
Agent

↓

Runtime

↓

Tool Registry

↓

AVAILABLE
```

The Tool is now discoverable.

---

# 4. REQUESTED

## Description

The model requested this Tool.

Example:

Model output:

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Pune"
  }
}
```

Transition:

```
AVAILABLE

↓

REQUESTED
```

At this point:

- Runtime received tool call.
- Execution has not started.

---

# 5. VALIDATING

## Description

Runtime validates the tool request.

Checks:

- Tool exists.
- Arguments match schema.
- Permissions allow execution.

Transition:

```
REQUESTED

↓

VALIDATING
```

Possible outcomes:

Success:

```
VALIDATING

↓

EXECUTING
```

Failure:

```
VALIDATING

↓

FAILED
```

---

# 6. EXECUTING

## Description

The Tool business logic is running.

Example:

```ts
await tool.execute(input, context);
```

Transition:

```
VALIDATING

↓

EXECUTING
```

During this state:

- External API calls may happen.
- Database operations may happen.
- Long-running work may happen.

---

# 7. COMPLETED

## Description

Tool execution finished successfully.

Example:

```json
{
  "city": "Pune",
  "temperature": "28°C"
}
```

Transition:

```
EXECUTING

↓

COMPLETED
```

The result returns to Runtime.

---

# 8. FAILED

## Description

Tool execution failed.

Examples:

- Validation failure.
- External API error.
- Permission denied.
- Timeout.

Transition:

```
EXECUTING

↓

FAILED
```

The Runtime decides the next step.

---

# 9. RETRYING

## Description

Runtime decided the failure is recoverable.

Example:

```
FAILED

↓

RETRYING

↓

EXECUTING
```

Controlled by:

- Retry policy.
- Maximum attempts.
- Time limits.

---

# 10. CANCELLED

## Description

Execution stopped before completion.

Causes:

- User cancellation.
- Timeout.
- AbortSignal.

Transition:

```
EXECUTING

↓

CANCELLED
```

---

# State Diagram

```
                 CREATED

                    |

                    ↓

              REGISTERED

                    |

                    ↓

              AVAILABLE

                    |

                    ↓

              REQUESTED

                    |

                    ↓

             VALIDATING

              /       \

             /         \

            ↓           ↓

      EXECUTING       FAILED

          |             |

          |             |

          ↓             ↓

     COMPLETED      RETRYING

                         |

                         |

                         ↓

                    EXECUTING


```

Cancellation:

```
EXECUTING

    |

    ↓

CANCELLED
```

---

# State Transition Rules

| Current State | Event                  | Next State |
| ------------- | ---------------------- | ---------- |
| CREATED       | register               | REGISTERED |
| REGISTERED    | runtime initialization | AVAILABLE  |
| AVAILABLE     | model requests tool    | REQUESTED  |
| REQUESTED     | validate input         | VALIDATING |
| VALIDATING    | valid                  | EXECUTING  |
| VALIDATING    | invalid                | FAILED     |
| EXECUTING     | success                | COMPLETED  |
| EXECUTING     | error                  | FAILED     |
| FAILED        | retry allowed          | RETRYING   |
| RETRYING      | retry start            | EXECUTING  |
| EXECUTING     | cancelled              | CANCELLED  |

---

# Invalid Transitions

These should never happen:

```
CREATED

↓

EXECUTING
```

Reason:

Tool must be registered first.

---

```
AVAILABLE

↓

COMPLETED
```

Reason:

A Tool must be requested and executed.

---

```
FAILED

↓

COMPLETED
```

Reason:

Failure requires recovery or termination.

---

# Runtime Ownership

Important:

The Tool itself does not manage its state machine.

Incorrect:

```ts
tool.state = 'EXECUTING';
```

Correct:

```
Runtime

owns lifecycle

↓

Tool

executes logic
```

Reason:

The Runtime understands:

- Agent execution.
- Turn limits.
- Retries.
- Cancellation.
- Policies.

---

# Observability Events

Each state transition creates events.

Example:

```
tool.registered

tool.requested

tool.validation.started

tool.execution.started

tool.execution.completed

tool.execution.failed

tool.retry.started
```

These events feed:

- Tracing.
- Metrics.
- Debugging.

---

# Future States

Possible future additions:

## WAITING_APPROVAL

For human approval workflows.

```
REQUESTED

↓

WAITING_APPROVAL

↓

EXECUTING
```

---

## STREAMING

For tools that return incremental output.

```
EXECUTING

↓

STREAMING

↓

COMPLETED
```

---

## SUSPENDED

For long-running workflows.

```
EXECUTING

↓

SUSPENDED

↓

RESUMED
```

---

# Design Decisions

## Decision 001 — Runtime Owns State

Accepted.

Reason:

Centralized control.

---

## Decision 002 — Tools Remain Stateless

Accepted.

Reason:

Tools should be reusable.

Example:

Same tool:

```
Agent A

↓

Weather Tool


Agent B

↓

Weather Tool
```

---

## Decision 003 — States Are Internal

Accepted.

Users should not manage:

```ts
tool.transition();
```

The SDK handles lifecycle automatically.

---

# Final Decision

Agni SDK models Tool execution as an explicit lifecycle:

```
CREATED

↓

REGISTERED

↓

AVAILABLE

↓

REQUESTED

↓

VALIDATING

↓

EXECUTING

↓

COMPLETED
```

With controlled failure paths:

```
FAILED

↓

RETRYING

↓

EXECUTING
```

The Runtime owns transitions.

Tools provide capabilities.

This creates a reliable foundation for retries, tracing, approvals, and future agent features.
