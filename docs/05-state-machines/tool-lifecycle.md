# Tool Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Tool System
**Document Type:** State Machine
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document defines the lifecycle states of a Tool inside Agni SDK.

A Tool is not simply a function execution.

A Tool has a complete lifecycle:

- registration,
- validation,
- availability,
- execution,
- completion,
- failure handling.

The state machine ensures that tools move through valid transitions and prevents inconsistent behavior.

---

# 2. Tool Lifecycle Overview

High-level lifecycle:

```text
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

PROCESSING_RESULT

   ↓

COMPLETED
```

Failure paths:

```text
ANY STATE

   ↓

FAILED
```

---

# 3. State Machine Diagram

```text
                         CREATED

                            |

                            v

                      REGISTERED

                            |

                            v

                       AVAILABLE

                            |

                            v

                       REQUESTED

                            |

                            v

                     VALIDATING

                       /        \

                      /          \

               VALID              INVALID

                 |                  |

                 v                  v

            EXECUTING            FAILED

                 |

                 v

        PROCESSING_RESULT

              /        \

             /          \

       SUCCESS        ERROR

          |              |

          v              v

     COMPLETED        FAILED
```

---

# 4. State Definitions

---

# State 1 — CREATED

## Purpose

The Tool object has been defined but is not yet part of the system.

Example:

Developer creates:

```text
Weather Tool
```

but it has not been registered.

---

## Allowed Operations

- define metadata,
- define schema,
- define execution logic.

---

## Cannot:

- execute,
- be discovered,
- be assigned to agents.

---

Transition:

```text
CREATED

↓

REGISTERED
```

---

# State 2 — REGISTERED

## Purpose

The Tool has been added to the Tool Registry.

Example:

```text
Tool Registry

weather_tool
```

The system knows that this capability exists.

---

## Actions

- store metadata,
- store schema,
- assign identifier.

---

## Cannot:

- execute unless available to an agent.

---

Transition:

```text
REGISTERED

↓

AVAILABLE
```

---

# State 3 — AVAILABLE

## Purpose

The Tool is ready to be used by an agent.

The tool is:

- registered,
- valid,
- discoverable.

---

Example:

```text
Research Agent

Available Tools:

- web_search
- summarizer
```

---

## Actions

- appear in agent tool list,
- be provided to the LLM.

---

Transition:

```text
AVAILABLE

↓

REQUESTED
```

---

# State 4 — REQUESTED

## Purpose

The LLM has selected this tool.

Example:

Model response:

```text
Call:

get_weather

Arguments:

{
 city:"Mumbai"
}
```

---

At this point:

- Runtime received tool request.
- Execution has not started.

---

Transition:

```text
REQUESTED

↓

VALIDATING
```

---

# State 5 — VALIDATING

## Purpose

The Tool System verifies that the request is valid.

Checks:

- tool exists,
- arguments match schema,
- permissions are valid,
- required fields exist.

---

Example:

Expected:

```json
{
  "city": "string"
}
```

Received:

```json
{
  "city": 123
}
```

Validation fails.

---

Valid path:

```text
VALIDATING

↓

EXECUTING
```

Invalid path:

```text
VALIDATING

↓

FAILED
```

---

# State 6 — EXECUTING

## Purpose

The actual tool capability is running.

Example:

```text
Weather Tool

↓

Weather API
```

---

During this state:

- external calls happen,
- business capability executes,
- results are generated.

---

Possible outcomes:

Success:

```text
EXECUTING

↓

PROCESSING_RESULT
```

Failure:

```text
EXECUTING

↓

FAILED
```

---

# State 7 — PROCESSING_RESULT

## Purpose

The Tool System prepares execution output.

Operations:

- normalize response,
- format result,
- attach metadata,
- capture execution information.

---

Example:

Raw:

```json
{
  "temp": 32
}
```

Processed:

```json
{
  "success": true,
  "data": {
    "temperature": 32
  }
}
```

---

Transition:

```text
PROCESSING_RESULT

↓

COMPLETED
```

---

# State 8 — COMPLETED

## Purpose

The tool execution finished successfully.

The result is returned:

```text
Tool

↓

Runtime

↓

LLM
```

---

Stored information:

- execution time,
- result,
- metadata.

---

# State 9 — FAILED

## Purpose

The tool could not complete successfully.

Failure examples:

- invalid arguments,
- tool not found,
- timeout,
- external API failure,
- internal exception.

---

Failure information:

```text
FAILED

{
 reason,
 error_type,
 timestamp
}
```

---

The Runtime decides:

- retry,
- inform model,
- terminate execution.

---

# 5. Tool Registration Lifecycle

Before execution, every tool follows:

```text
Developer Defines Tool

↓

Tool Created

↓

Schema Validation

↓

Registered

↓

Available To Agents
```

---

# 6. Execution Lifecycle

During agent execution:

```text
LLM Chooses Tool

↓

Runtime Receives Request

↓

Tool Requested

↓

Validate Input

↓

Execute

↓

Return Result
```

---

# 7. Invalid State Transitions

The following transitions are not allowed.

---

## Direct Execution

Invalid:

```text
CREATED

↓

EXECUTING
```

Reason:

Tool must be registered and validated first.

---

## Skipping Validation

Invalid:

```text
REQUESTED

↓

EXECUTING
```

Reason:

Every tool input must be validated.

---

## Agent Access Before Registration

Invalid:

```text
CREATED

↓

AVAILABLE
```

Reason:

Only registered tools can become available.

---

# 8. Failure Handling Model

Failures can happen in multiple states.

---

## Registration Failure

Example:

Duplicate tool name.

Flow:

```text
CREATED

↓

REGISTERED FAILED
```

---

## Validation Failure

Example:

Wrong arguments.

Flow:

```text
VALIDATING

↓

FAILED
```

---

## Execution Failure

Example:

API timeout.

Flow:

```text
EXECUTING

↓

FAILED
```

---

# 9. State Ownership

| State             | Owner                   |
| ----------------- | ----------------------- |
| CREATED           | Developer               |
| REGISTERED        | Tool Registry           |
| AVAILABLE         | Agent Configuration     |
| REQUESTED         | Runtime                 |
| VALIDATING        | Tool Executor           |
| EXECUTING         | Tool Executor           |
| PROCESSING_RESULT | Tool Executor           |
| COMPLETED         | Runtime                 |
| FAILED            | Runtime + Observability |

---

# 10. Design Principles

## Explicit State Management

Tool behavior is predictable.

---

## Invalid Transitions Are Prevented

The system avoids unexpected execution.

---

## Clear Ownership

Each state has a responsible component.

---

## Failure Isolation

Tool failures are contained.

---

## Observability

Every state transition can be traced.

---

# 11. Future Extensions

Future states may include:

---

## WAITING_FOR_APPROVAL

For sensitive operations.

Example:

```text
EXECUTING

↓

WAITING_FOR_APPROVAL

↓

EXECUTING
```

---

## RETRYING

For temporary failures.

Example:

```text
FAILED

↓

RETRYING

↓

EXECUTING
```

---

## CANCELLED

For user cancellation.

Example:

```text
EXECUTING

↓

CANCELLED
```

---

# Summary

The Tool Lifecycle defines how a capability moves through Agni SDK.

Complete lifecycle:

```text
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

PROCESSING_RESULT

↓

COMPLETED
```

or:

```text
ANY STATE

↓

FAILED
```

This state machine ensures tools remain predictable, safe, and observable while allowing Agni SDK to scale from simple functions into a complete agent capability platform.
