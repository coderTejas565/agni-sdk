# Tool Approval Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Guardrails System
**Diagram:** Tool Approval Flow
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how Agni SDK validates and approves tool execution before a tool is allowed to run.

Unlike normal input validation, this flow focuses specifically on tools because they can perform actions that affect external systems.

Examples include:

- sending emails,
- making payments,
- deleting data,
- calling external APIs,
- modifying databases.

The objective is to ensure that every tool invocation is explicitly authorized before execution.

---

# 2. Why Tool Approval Exists

An LLM is responsible for reasoning.

It is **not** responsible for authorization.

Without approval:

```text
LLM

↓

Tool Call

↓

Execute
```

The model becomes both the planner and the decision maker.

With approval:

```text
LLM

↓

Tool Request

↓

Tool Guardrail

↓

Approved?

↓

Execute
```

The Runtime remains in control of execution while Guardrails remain in control of authorization.

---

# 3. Actors Involved

```text
User

↓

Runtime

↓

Provider (LLM)

↓

Tool Registry

↓

Guardrails Engine

↓

Policy Engine

↓

Tool Executor

↓

External System
```

---

# 4. Complete Sequence Diagram

```text
                   User

                    │

                    ▼

                 Runtime

                    │

                    ▼

              Provider (LLM)

                    │

         Tool Call Requested

                    ▼

              Tool Registry

                    │

                    ▼

           Guardrails Engine

                    │

                    ▼

             Policy Engine

                    │

         Evaluate Policies

                    │

                    ▼

          Guardrail Decision

                    │

          ┌─────────┼──────────┐

          ▼         ▼          ▼

       ALLOW     BLOCK     APPROVAL

          │                    │

          ▼                    ▼

    Tool Executor        Wait For Approval

          │

          ▼

    External System

          │

          ▼

      Tool Result

          │

          ▼

        Runtime
```

---

# 5. Detailed Execution Flow

## Step 1 — Model Requests a Tool

The Provider returns a tool call instead of a final response.

Example:

```text
Tool:
sendEmail()

Arguments:
{
 recipient: "user@example.com",
 subject: "Invoice"
}
```

The Provider only suggests the tool.

It does not execute it.

---

## Step 2 — Runtime Receives Tool Request

Runtime pauses the agent loop.

Instead of executing immediately, it delegates the request.

```text
Runtime

↓

Tool Registry
```

The Tool Registry verifies:

- tool exists,
- tool is registered,
- schema is valid.

---

## Step 3 — Guardrails Validation

The Tool Registry forwards the request for authorization.

```text
Tool Registry

↓

Guardrails Engine
```

The request includes:

- tool name,
- validated arguments,
- execution context,
- session information,
- active policies.

---

## Step 4 — Policy Evaluation

The Policy Engine evaluates all applicable rules.

Examples:

```text
Maximum payment amount

User permissions

Allowed execution hours

Environment restrictions

Approval requirements
```

Every matching policy contributes to the final decision.

---

## Step 5 — Decision Generation

The Guardrails Engine returns a structured decision.

Example:

Approved:

```text
{
 status: "ALLOWED",
 reason: "All policies satisfied"
}
```

Blocked:

```text
{
 status: "BLOCKED",
 reason: "User lacks permission"
}
```

Approval Required:

```text
{
 status: "REQUIRES_APPROVAL",
 reason: "High-risk operation"
}
```

---

## Step 6 — Runtime Reacts

### Allowed

```text
Runtime

↓

Tool Executor

↓

Execute Tool
```

---

### Blocked

```text
Runtime

↓

Stop Tool Execution

↓

Return Error
```

The tool never runs.

---

### Approval Required

```text
Runtime

↓

Pause Run

↓

Request Approval

↓

Resume After Decision
```

The Run remains suspended until approval is received.

---

## Step 7 — Tool Execution

If approved:

```text
Tool Executor

↓

External System

↓

Tool Result
```

Examples:

- Email sent
- Payment processed
- File created
- Database updated

---

## Step 8 — Return Result

The Tool Executor returns the result.

```text
Tool Result

↓

Runtime

↓

Continue Agent Loop
```

The result becomes part of the conversation context and may be sent back to the Provider for further reasoning.

---

# 6. Decision Paths

## Path 1 — Approved

```text
Tool Request

↓

Policy Check

↓

Approved

↓

Execute

↓

Return Result
```

---

## Path 2 — Blocked

```text
Tool Request

↓

Policy Check

↓

Blocked

↓

Abort Execution
```

---

## Path 3 — Human Approval

```text
Tool Request

↓

Policy Check

↓

Approval Required

↓

Human Decision

↓

Approved?

↓

Execute / Cancel
```

---

# 7. Failure Flows

## Tool Not Registered

```text
Tool Request

↓

Registry Lookup

↓

Not Found

↓

Return Error
```

---

## Invalid Tool Arguments

```text
Tool Request

↓

Schema Validation

↓

Invalid

↓

Reject
```

---

## Policy Engine Failure

```text
Guardrails

↓

Policy Engine

↓

Exception
```

Recommended behavior:

High-risk operations should fail safely rather than execute without validation.

---

## Approval Timeout

```text
Approval Requested

↓

Timeout

↓

Cancel Tool Execution
```

---

## External Tool Failure

```text
Tool Executor

↓

External API

↓

Failure
```

The failure is returned to the Runtime, which decides whether to retry, fail the Run, or continue.

---

# 8. Responsibility Boundaries

## Runtime

Responsible for:

- coordinating execution,
- waiting for approval,
- continuing the Run.

Never authorizes tools.

---

## Tool Registry

Responsible for:

- locating tools,
- validating schemas,
- preparing execution.

Never decides permissions.

---

## Guardrails Engine

Responsible for:

- evaluating authorization,
- enforcing policies.

Never executes tools.

---

## Policy Engine

Responsible for:

- applying developer-defined rules.

---

## Tool Executor

Responsible for:

- invoking the approved tool,
- returning execution results.

---

# 9. Design Principles

## Least Privilege

Tools should only execute when explicitly authorized.

---

## Separation of Responsibilities

Planning, authorization, and execution belong to different components.

---

## Explicit Authorization

Every tool execution must have a recorded approval decision.

---

## Fail Safe

If authorization cannot be determined, execution should not continue automatically.

---

## Auditability

Every approval decision should be traceable.

---

# 10. Edge Cases

The system should correctly handle:

- unknown tool names,
- duplicate tool requests,
- invalid schemas,
- approval timeout,
- policy conflicts,
- missing permissions,
- concurrent approval requests,
- tool execution failures,
- revoked permissions during execution.

---

# 11. Future Enhancements

## Role-Based Authorization

Policies based on user roles.

---

## Multi-Step Approval

Example:

```text
Payment

↓

Manager Approval

↓

Finance Approval

↓

Execute
```

---

## External Policy Providers

Load authorization rules from external systems.

---

## Approval History

Maintain a complete audit trail of tool approvals and rejections.

---

# Summary

The Tool Approval Flow ensures that every tool invocation is authorized before execution.

Complete lifecycle:

```text
Provider

↓

Tool Request

↓

Tool Registry

↓

Guardrails Engine

↓

Policy Engine

↓

Decision

↓

Tool Executor

↓

External System

↓

Tool Result

↓

Runtime
```

The guiding principle is:

> The model may request a tool, but only the system can authorize its execution.
