# Run Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Runtime
**State Machine:** Agent Run Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document defines the lifecycle states of an Agent Run inside Agni SDK.

A Run represents one complete execution of an Agent.

The state machine defines:

- valid execution states,
- allowed transitions,
- failure paths,
- cancellation behavior.

The Runtime is responsible for enforcing these transitions.

---

# 2. Run Concept

A Run is an isolated execution instance created when a developer invokes an Agent.

Example:

```text
Agent

+

User Input

↓

Run

↓

Execution Lifecycle

↓

Final Result
```

Each Run maintains its own:

- execution state,
- context,
- tool results,
- errors,
- final output.

---

# 3. State Machine Overview

```text
                         CREATED

                            |

                            v

                     INITIALIZING

                            |

                            v

                 PREPARING_CONTEXT

                            |

                            v

                 CALLING_PROVIDER

                            |

                            v

              WAITING_FOR_PROVIDER

                            |

                            v

              PROCESSING_RESPONSE

                         /       \

                        /         \

                       v           v

              EXECUTING_TOOL    COMPLETED

                       |

                       v

              UPDATING_CONTEXT

                       |

                       v

              CALLING_PROVIDER

                       |

                       v

              PROCESSING_RESPONSE



Any state can transition to:


              FAILED


or


              CANCELLED
```

---

# 4. State Definitions

---

# CREATED

## Purpose

Initial state when a Run is created.

At this stage:

- Run ID exists.
- Agent configuration is attached.
- User input is available.

No execution has started.

---

## Entry Conditions

A developer calls:

```text
Agent.run(input)
```

---

## Allowed Transitions

```text
CREATED

↓

INITIALIZING
```

---

# INITIALIZING

## Purpose

Prepare the execution environment.

Actions:

- create execution context,
- initialize runtime services,
- create trace information.

---

## Allowed Transitions

Success:

```text
INITIALIZING

↓

PREPARING_CONTEXT
```

Failure:

```text
INITIALIZING

↓

FAILED
```

---

# PREPARING_CONTEXT

## Purpose

Build the complete context required by the model.

Context may include:

- system instructions,
- user input,
- conversation history,
- memory,
- available tools.

---

## Allowed Transitions

Success:

```text
PREPARING_CONTEXT

↓

CALLING_PROVIDER
```

Failure:

```text
PREPARING_CONTEXT

↓

FAILED
```

---

# CALLING_PROVIDER

## Purpose

Send the prepared context to the selected model provider.

The Runtime does not know the specific model implementation.

Example:

```text
Runtime

↓

Provider

↓

OpenAI / Claude / Gemini
```

---

## Allowed Transitions

```text
CALLING_PROVIDER

↓

WAITING_FOR_PROVIDER
```

---

# WAITING_FOR_PROVIDER

## Purpose

Waiting for the model response.

Possible events:

- response received,
- timeout,
- provider error.

---

## Allowed Transitions

Success:

```text
WAITING_FOR_PROVIDER

↓

PROCESSING_RESPONSE
```

Failure:

```text
WAITING_FOR_PROVIDER

↓

FAILED
```

---

# PROCESSING_RESPONSE

## Purpose

Interpret the model response.

The Runtime determines the next execution step.

Possible outcomes:

1. Final answer produced.
2. Tool execution required.

---

## Transition 1 — Final Answer

```text
PROCESSING_RESPONSE

↓

COMPLETED
```

---

## Transition 2 — Tool Call

```text
PROCESSING_RESPONSE

↓

EXECUTING_TOOL
```

---

# EXECUTING_TOOL

## Purpose

Execute tools requested by the model.

Examples:

- API calls,
- database queries,
- calculations.

The Runtime coordinates execution but does not implement tools.

---

## Allowed Transitions

Success:

```text
EXECUTING_TOOL

↓

UPDATING_CONTEXT
```

Failure:

```text
EXECUTING_TOOL

↓

FAILED
```

---

# UPDATING_CONTEXT

## Purpose

Add new information after tool execution.

Updates may include:

- tool results,
- conversation state,
- execution history.

---

## Allowed Transitions

```text
UPDATING_CONTEXT

↓

CALLING_PROVIDER
```

This creates the agent loop.

---

# COMPLETED

## Purpose

Terminal successful state.

The Run contains:

- final response,
- execution metadata,
- trace information.

No further transitions are allowed.

---

# FAILED

## Purpose

Terminal unsuccessful state.

A Run enters FAILED when recovery is not possible.

Possible causes:

- provider failure,
- tool failure,
- invalid response,
- exceeded limits,
- internal errors.

---

# CANCELLED

## Purpose

Terminal state when execution is intentionally stopped.

Examples:

- user cancellation,
- timeout,
- system shutdown.

---

# 5. Terminal States

The Run has three terminal states:

```text
COMPLETED

FAILED

CANCELLED
```

After reaching a terminal state:

- execution stops,
- no further transitions are allowed.

---

# 6. Transition Rules

## Rule 1 — Runtime Owns Transitions

Only Runtime can change Run state.

Other components can only report events.

Example:

Tool:

```text
Tool completed successfully
```

Runtime:

```text
EXECUTING_TOOL

↓

UPDATING_CONTEXT
```

---

## Rule 2 — Invalid Transitions Are Rejected

Example:

Invalid:

```text
COMPLETED

↓

CALLING_PROVIDER
```

A completed Run cannot restart.

---

## Rule 3 — Every Run Has an End State

Every execution must eventually reach:

```text
COMPLETED

or

FAILED

or

CANCELLED
```

This prevents hanging executions.

---

# 7. Edge Cases

## Infinite Agent Loop

Problem:

The model continuously requests tools.

Solution:

Runtime enforces:

- maximum iterations,
- maximum execution time.

Transition:

```text
ANY STATE

↓

FAILED
```

---

## Provider Timeout

Problem:

Model does not respond.

Solution:

Runtime triggers failure handling.

```text
WAITING_FOR_PROVIDER

↓

FAILED
```

---

## Tool Failure

Problem:

External capability fails.

Solution:

Runtime decides:

- retry,
- continue,
- fail.

---

## User Cancellation

Problem:

User stops execution.

Transition:

```text
ANY ACTIVE STATE

↓

CANCELLED
```

---

## Concurrent Runs

Multiple Runs must remain isolated.

Example:

```text
Run A

↓

Travel Agent


Run B

↓

Coding Agent
```

They must not share:

- context,
- memory,
- tool results,
- state.

---

# 8. Design Principles

## Explicit State

Every Run has a clear lifecycle.

---

## Controlled Transitions

State changes happen only through Runtime.

---

## Failure Awareness

Failures are first-class execution paths.

---

## Predictability

The system behavior can be reasoned about before execution.

---

## Observability

Every state transition should generate an event.

Example:

```text
RUN_CREATED

RUN_STARTED

TOOL_STARTED

RUN_COMPLETED
```

---

# Summary

The Run Lifecycle State Machine defines how an Agent execution progresses inside Agni SDK.

The Runtime controls the transition between states:

```text
Created

↓

Initialize

↓

Prepare Context

↓

Model Interaction

↓

Tool Execution Loop

↓

Complete
```

By modeling execution as an explicit state machine, Agni SDK avoids unpredictable behavior and creates a reliable foundation for advanced agent capabilities.
