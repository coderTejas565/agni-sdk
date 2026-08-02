# Guardrail Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Guardrails System
**Diagram:** Guardrail Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document defines the lifecycle of a guardrail evaluation within Agni SDK.

Every validation request passes through a predictable sequence of states before a final decision is returned to the Runtime.

This state machine guarantees that:

- every validation follows the same execution path,
- invalid state transitions are prevented,
- decisions are deterministic,
- failures are handled safely.

Unlike the Runtime lifecycle, which manages an entire agent run, this lifecycle represents a **single guardrail evaluation**.

---

# 2. Guardrail Lifecycle Overview

```text
CREATED

   │

   ▼

VALIDATING

   │

   ▼

EVALUATING_POLICIES

   │

   ▼

DECISION_MADE

 ┌──┼───────────┐
 ▼  ▼           ▼

ALLOW BLOCK REQUIRE_APPROVAL

 │    │             │
 ▼    ▼             ▼

COMPLETED     COMPLETED     WAITING_FOR_APPROVAL
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼

                 APPROVED              REJECTED
                     │                     │
                     ▼                     ▼

                COMPLETED            COMPLETED

Failure at any stage
        │
        ▼

FAILED
```

---

# 3. State Definitions

The Guardrails System consists of the following states:

```text
CREATED

VALIDATING

EVALUATING_POLICIES

DECISION_MADE

ALLOW

BLOCK

REQUIRE_APPROVAL

WAITING_FOR_APPROVAL

APPROVED

REJECTED

COMPLETED

FAILED
```

---

# 4. State Descriptions

---

# CREATED

## Meaning

A new validation request has been created.

The request may originate from:

- Runtime,
- Tool Registry,
- Output Validator,
- Input Validator.

At this stage, no validation has started.

---

## Entry Data

The request contains:

- target operation,
- execution context,
- metadata,
- applicable policies.

---

## Allowed Transition

```text
CREATED

↓

VALIDATING
```

---

# VALIDATING

## Meaning

Basic validation begins.

Examples:

- required fields,
- operation type,
- request integrity,
- execution context.

This ensures the request is structurally valid before policy evaluation.

---

## Possible Outcomes

```text
VALIDATING

↓

EVALUATING_POLICIES
```

or

```text
VALIDATING

↓

FAILED
```

---

# EVALUATING_POLICIES

## Meaning

The Policy Engine evaluates every applicable rule.

Examples:

- permission checks,
- safety policies,
- approval requirements,
- developer-defined restrictions.

Multiple policies may execute during this state.

---

## Possible Outcomes

```text
EVALUATING_POLICIES

↓

DECISION_MADE
```

or

```text
EVALUATING_POLICIES

↓

FAILED
```

---

# DECISION_MADE

## Meaning

The Policy Engine has finished evaluating all rules.

A final decision object is created.

Possible decisions:

- ALLOW
- BLOCK
- REQUIRE_APPROVAL

---

## Allowed Transitions

```text
DECISION_MADE

↓

ALLOW
```

```text
DECISION_MADE

↓

BLOCK
```

```text
DECISION_MADE

↓

REQUIRE_APPROVAL
```

---

# ALLOW

## Meaning

The operation satisfies all policies.

Runtime may continue execution.

Example:

```text
Tool Request

↓

ALLOW

↓

Execute Tool
```

---

## Transition

```text
ALLOW

↓

COMPLETED
```

---

# BLOCK

## Meaning

The request violates one or more policies.

Execution must stop.

Example:

```text
Payment

↓

BLOCK

↓

Return Error
```

---

## Transition

```text
BLOCK

↓

COMPLETED
```

---

# REQUIRE_APPROVAL

## Meaning

The request is valid but requires external approval before execution.

Examples:

- large payments,
- destructive operations,
- privileged tools.

---

## Transition

```text
REQUIRE_APPROVAL

↓

WAITING_FOR_APPROVAL
```

---

# WAITING_FOR_APPROVAL

## Meaning

Execution is paused while waiting for an external decision.

Possible approval sources:

- human operator,
- administrator,
- external approval service.

The Runtime remains suspended.

---

## Possible Outcomes

Approved:

```text
WAITING_FOR_APPROVAL

↓

APPROVED
```

Rejected:

```text
WAITING_FOR_APPROVAL

↓

REJECTED
```

Timeout:

```text
WAITING_FOR_APPROVAL

↓

FAILED
```

---

# APPROVED

## Meaning

Approval has been granted.

Runtime may continue execution.

---

## Transition

```text
APPROVED

↓

COMPLETED
```

---

# REJECTED

## Meaning

Approval has been denied.

Execution will not continue.

---

## Transition

```text
REJECTED

↓

COMPLETED
```

---

# COMPLETED

## Meaning

The validation request has finished successfully.

Possible outcomes:

- allowed,
- blocked,
- approved,
- rejected.

No further transitions are permitted.

---

# FAILED

## Meaning

The validation process could not be completed.

Examples:

- policy engine failure,
- malformed request,
- approval timeout,
- unexpected exception.

The Runtime should handle the failure according to its error strategy.

---

# 5. Complete State Machine

```text
                    CREATED
                        │
                        ▼
                  VALIDATING
                        │
                        ▼
            EVALUATING_POLICIES
                        │
                        ▼
                DECISION_MADE
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          ALLOW     BLOCK   REQUIRE_APPROVAL
             │         │         │
             ▼         ▼         ▼
       COMPLETED  COMPLETED WAITING_FOR_APPROVAL
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
                 APPROVED                REJECTED
                      │                       │
                      ▼                       ▼
                 COMPLETED              COMPLETED

Any state
   │
   ▼
FAILED
```

---

# 6. State Transition Table

| Current State        | Event                       | Next State           |
| -------------------- | --------------------------- | -------------------- |
| CREATED              | Validation starts           | VALIDATING           |
| VALIDATING           | Request valid               | EVALUATING_POLICIES  |
| VALIDATING           | Validation error            | FAILED               |
| EVALUATING_POLICIES  | Rules evaluated             | DECISION_MADE        |
| EVALUATING_POLICIES  | Evaluation error            | FAILED               |
| DECISION_MADE        | Decision = ALLOW            | ALLOW                |
| DECISION_MADE        | Decision = BLOCK            | BLOCK                |
| DECISION_MADE        | Decision = REQUIRE_APPROVAL | REQUIRE_APPROVAL     |
| ALLOW                | Execution permitted         | COMPLETED            |
| BLOCK                | Execution denied            | COMPLETED            |
| REQUIRE_APPROVAL     | Approval requested          | WAITING_FOR_APPROVAL |
| WAITING_FOR_APPROVAL | Approved                    | APPROVED             |
| WAITING_FOR_APPROVAL | Rejected                    | REJECTED             |
| WAITING_FOR_APPROVAL | Timeout                     | FAILED               |
| APPROVED             | Resume execution            | COMPLETED            |
| REJECTED             | End request                 | COMPLETED            |

---

# 7. Invariants

The following rules must always hold.

---

## Invariant 1

No execution decision exists before policy evaluation.

Invalid:

```text
CREATED

↓

ALLOW
```

Correct:

```text
CREATED

↓

VALIDATING

↓

EVALUATING_POLICIES

↓

ALLOW
```

---

## Invariant 2

Every request ends in a terminal state.

Terminal states:

- COMPLETED
- FAILED

---

## Invariant 3

A blocked operation must never execute.

```text
BLOCK

↓

❌ Execute Tool
```

This transition is forbidden.

---

## Invariant 4

Approval is only required for policies that explicitly demand it.

Normal operations should not pause unnecessarily.

---

## Invariant 5

Policy evaluation is read-only.

Policies may inspect execution context but must not modify Runtime state.

---

# 8. Failure Scenarios

## Invalid Request

```text
CREATED

↓

VALIDATING

↓

FAILED
```

---

## Policy Engine Crash

```text
EVALUATING_POLICIES

↓

FAILED
```

---

## Approval Timeout

```text
WAITING_FOR_APPROVAL

↓

FAILED
```

---

## Unknown Decision

If a policy returns an unsupported decision:

```text
DECISION_MADE

↓

FAILED
```

This prevents undefined behavior.

---

# 9. Design Principles

## Explicit State Management

Every validation request follows a well-defined lifecycle.

---

## Separation of Responsibilities

Runtime executes.

Guardrails validate.

Policies decide.

---

## Fail Safe

Unknown or failed validations should never silently allow execution.

---

## Auditability

Every state transition should be traceable for debugging and compliance.

---

## Extensibility

New decision types or policy stages can be added without changing existing lifecycle semantics.

---

# 10. Future Enhancements

## Multi-Level Approval

```text
WAITING_FOR_MANAGER

↓

WAITING_FOR_ADMIN

↓

APPROVED
```

---

## Policy Chains

Support ordered policy pipelines where one policy's result influences the next.

---

## Distributed Approval

Allow approval from external workflow systems.

---

## Automatic Policy Retries

Retry transient policy failures before marking the request as failed.

---

# Summary

The Guardrail Lifecycle defines how every validation request moves through Agni SDK.

Complete lifecycle:

```text
Validation Request

↓

Validation

↓

Policy Evaluation

↓

Decision

↓

Allow / Block / Approval

↓

Completed
```

The key principle is:

> Every action requested by an agent must pass through a predictable validation lifecycle before it can affect the outside world.
