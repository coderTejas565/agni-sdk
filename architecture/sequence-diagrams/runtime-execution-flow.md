# Runtime Execution Flow — Sequence Diagram

**Project:** Agni SDK
**Diagram:** Runtime Execution Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how an agent execution flows through the Agni SDK Runtime.

The goal is to visualize:

- how a Run is created,
- how components interact,
- how decisions are processed,
- how tools are executed,
- how execution completes.

This diagram focuses on behavior, not implementation details.

---

# 2. Runtime Execution Overview

An agent execution begins when a developer sends user input to an Agent.

The Runtime then coordinates the complete lifecycle:

```text
User Request

↓

Create Run

↓

Prepare Context

↓

Ask Model

↓

Process Decision

↓

Execute Tools if Required

↓

Continue Until Completion

↓

Return Result
```

---

# 3. Actors Involved

```text
Developer

↓

Runtime

↓

Run Manager

↓

Context Builder

↓

Memory

↓

Provider

↓

LLM Model

↓

Tool System

↓

Observability
```

---

# 4. High-Level Sequence Diagram

```text
Developer
    |
    |
    | run(agent, input)
    |
    v
+-----------+
| Runtime   |
+-----------+
    |
    |
    | createRun()
    |
    v
+-------------+
| Run Manager |
+-------------+
    |
    |
    | prepare context
    |
    v
+----------------+
| Context Builder|
+----------------+
    |
    |
    | load memory
    |
    v
+-----------+
| Memory    |
+-----------+
    |
    |
    | context ready
    |
    v
+-------------+
| Provider    |
+-------------+
    |
    |
    | send prompt
    |
    v
+-------------+
| LLM Model   |
+-------------+

```

---

# 5. Detailed Execution Flow

## Step 1 — Run Creation

The developer starts an agent execution.

Example:

```text
Developer

↓

Runtime.run()

↓

Create new Run
```

The Runtime creates a unique execution context.

The Run contains:

- Run ID
- Agent reference
- Input
- Initial status

Initial state:

```text
CREATED
```

---

# Step 2 — Initialization

Runtime initializes required services.

Flow:

```text
Runtime

↓

Run Manager

↓

Initialize Run
```

State transition:

```text
CREATED

↓

INITIALIZING
```

---

# Step 3 — Context Preparation

Before contacting the model, Runtime prepares the context.

The Context Builder collects:

- agent instructions,
- user input,
- previous conversation,
- memory information,
- available tools.

Flow:

```text
Runtime

↓

Context Builder

↓

Memory

↓

Prepared Context
```

State:

```text
PREPARING_CONTEXT
```

---

# Step 4 — Provider Call

Runtime sends the prepared context to the Provider.

Flow:

```text
Runtime

↓

Provider

↓

LLM Model
```

The Provider hides model-specific details.

The Runtime does not know whether the model is:

- OpenAI,
- Claude,
- Gemini.

State:

```text
CALLING_PROVIDER
```

---

# Step 5 — Model Response Processing

The model returns a response.

Possible responses:

## Case 1 — Final Answer

```text
Model

↓

Final Response
```

Execution completes.

---

## Case 2 — Tool Request

```text
Model

↓

Tool Call Request
```

Runtime starts tool execution.

---

# Step 6 — Tool Execution

When a tool call is detected:

```text
Runtime

↓

Execution Coordinator

↓

Tool System

↓

Tool Implementation
```

Example:

```text
Weather Tool

↓

Weather API

↓

Result
```

The result is returned to Runtime.

---

# Step 7 — Context Update

After tool execution:

```text
Tool Result

↓

Runtime

↓

Context Update

↓

Provider Again
```

The Runtime continues the execution loop.

The model receives:

- original request,
- previous reasoning context,
- tool result.

---

# Step 8 — Completion

When the model produces a final response:

```text
Provider

↓

Runtime

↓

Run Manager

↓

Complete Run
```

Final state:

```text
COMPLETED
```

---

# 6. Complete Sequence Diagram

```text
Developer

   |
   | execute()
   |
   v

Runtime

   |
   | create run
   |
   v

Run Manager

   |
   | initialize
   |
   v

Context Builder

   |
   | load memory
   |
   v

Memory

   |
   | context
   |
   v

Provider

   |
   | request
   |
   v

LLM


   |
   | response
   |
   v

Decision Engine


   |
   +-------------------+
   |                   |
   | Final Answer      | Tool Required
   |                   |
   v                   v

Complete Run       Tool System

                       |
                       |
                       v

                  Tool Result

                       |
                       |
                       v

                Context Update

                       |
                       |
                       v

                   Provider Again


                       |
                       v

                 Final Response


                       |
                       v

                 Complete Run
```

---

# 7. Failure Paths

Runtime must handle failures during any stage.

---

## Provider Failure

Example:

- timeout,
- rate limit,
- unavailable model.

Flow:

```text
Provider

↓

Failure Manager

↓

Retry / Fail Run
```

---

## Tool Failure

Example:

- API error,
- invalid input,
- timeout.

Flow:

```text
Tool

↓

Failure Manager

↓

Recovery Strategy
```

---

## Guardrail Failure

Example:

- unsafe input,
- invalid output.

Flow:

```text
Guardrail

↓

Runtime

↓

Reject / Modify / Retry
```

---

# 8. Runtime Guarantees

The Runtime guarantees:

## Single Execution Owner

Only Runtime controls execution flow.

---

## State Consistency

Every Run has a valid lifecycle state.

---

## Component Isolation

Failure in one component should not corrupt the entire system.

---

## Observability

Important execution events are available for tracing.

---

# 9. Design Notes

The Runtime execution flow intentionally separates:

```text
Coordination

from

Capability
```

Runtime decides:

> "What should happen next?"

Specialized components decide:

> "How should this operation happen?"

This separation allows Agni SDK to grow without increasing Runtime complexity.

---

# Summary

The Runtime execution flow represents the complete lifecycle of an AI agent Run.

The Runtime acts as the central coordinator:

- creating execution context,
- preparing information,
- communicating with models,
- handling tools,
- managing failures,
- completing execution.

The sequence diagram establishes the behavioral contract between all major SDK components.
