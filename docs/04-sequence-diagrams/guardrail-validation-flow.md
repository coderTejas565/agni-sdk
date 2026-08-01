# Guardrail Validation Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Guardrails System
**Diagram:** Guardrail Validation Flow
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how Agni SDK validates requests using the Guardrails System during agent execution.

Guardrail validation ensures that an agent only performs actions that satisfy developer-defined policies.

The flow explains:

- how Runtime requests validation,
- how Guardrails evaluate policies,
- how validation decisions are produced,
- how Runtime reacts to those decisions.

---

# 2. Validation Overview

High-level flow:

```text
Runtime

↓

Guardrails Engine

↓

Policy Evaluation

↓

Decision

↓

Runtime

↓

Continue / Block / Require Approval
```

---

# 3. Actors Involved

```text
Developer
    │
    ▼
Policy Definitions
    │
    ▼
Guardrails Engine
    │
    ▼
Policy Engine
    │
    ▼
Runtime
    │
    ▼
Provider / Tools
```

---

# 4. Why Validation Exists

Without validation:

```text
User Input

↓

LLM

↓

Tool Call

↓

Execute
```

The model becomes the final authority.

---

With validation:

```text
User Input

↓

LLM

↓

Guardrails

↓

Decision

↓

Execution
```

The Runtime never executes an operation without a safety decision.

---

# 5. Complete Sequence Diagram

```text
                  User

                   │

                   ▼

                Runtime

                   │

     Validation Request

                   ▼

          Guardrails Engine

                   │

                   ▼

            Policy Engine

                   │

         Evaluate Rules

                   │

                   ▼

         Guardrail Decision

                   │

                   ▼

          Guardrails Engine

                   │

                   ▼

                Runtime

           ┌────────┼────────┐
           ▼        ▼        ▼

        Continue  Block   Approval

           │                 │
           ▼                 ▼

      Provider/Tools     Wait For Approval
```

---

# 6. Detailed Execution Flow

## Step 1 — Runtime Reaches a Validation Checkpoint

During execution the Runtime reaches a point that requires validation.

Examples:

- user input received,
- tool selected,
- model response generated.

Runtime delegates validation.

```text
Runtime

↓

Guardrails Engine

"Validate this operation."
```

---

## Step 2 — Guardrails Receives Validation Request

The request contains:

- execution context,
- operation type,
- metadata,
- active policies.

Example:

```text
Operation:
Tool Execution

Tool:
sendEmail()

Arguments:
recipient@example.com
```

---

## Step 3 — Policy Engine Evaluates Rules

The Guardrails Engine forwards the request to the Policy Engine.

Possible checks:

- permissions,
- input constraints,
- developer rules,
- approval requirements,
- safety policies.

Example:

```text
Rule:

Payment Amount <= 1000
```

---

## Step 4 — Policy Evaluation

Every applicable policy is evaluated.

Example:

```text
Policy 1

✓ Passed

Policy 2

✓ Passed

Policy 3

✗ Failed
```

The Policy Engine aggregates the results.

---

## Step 5 — Decision Generation

The Guardrails Engine creates a decision object.

Example:

Allowed:

```text
{
 status: "ALLOWED",
 reason: "All policies passed"
}
```

Blocked:

```text
{
 status: "BLOCKED",
 reason: "Payment exceeds maximum limit"
}
```

Approval:

```text
{
 status: "REQUIRES_APPROVAL",
 reason: "High-risk operation"
}
```

---

## Step 6 — Runtime Handles Decision

Runtime does not reinterpret policies.

It reacts to the decision.

```text
ALLOWED

↓

Continue Execution
```

```text
BLOCKED

↓

Stop Run
```

```text
REQUIRES_APPROVAL

↓

Pause Execution
```

---

# 7. Decision Paths

## Allowed

```text
Runtime

↓

Guardrails

↓

ALLOWED

↓

Continue
```

---

## Blocked

```text
Runtime

↓

Guardrails

↓

BLOCKED

↓

Return Error
```

---

## Approval Required

```text
Runtime

↓

Guardrails

↓

Approval Required

↓

Wait

↓

Resume
```

---

# 8. Failure Flows

## Policy Evaluation Failure

Example:

```text
Policy Engine

↓

Unexpected Exception
```

Runtime receives:

```text
FAILED
```

Possible actions:

- fail closed,
- retry,
- log error.

---

## Missing Policy

If no policy exists:

```text
Request

↓

Default Policy

↓

Decision
```

The SDK should have a configurable default behavior.

Example:

- allow by default,
- deny by default.

---

## Guardrails Engine Failure

```text
Runtime

↓

Guardrails Engine

↓

Unavailable
```

Recommended behavior:

High-risk operations should fail safely rather than execute unchecked.

---

# 9. Responsibility Boundaries

## Runtime

Responsible for:

- requesting validation,
- acting on decisions.

Never evaluates rules.

---

## Guardrails Engine

Responsible for:

- coordinating validation,
- producing decisions.

---

## Policy Engine

Responsible for:

- evaluating developer-defined policies.

---

## Provider

Responsible only for generating model responses.

It does not know guardrails exist.

---

## Tools

Execute only after approval from Guardrails.

---

# 10. Design Principles

## Runtime Never Owns Policies

Policies belong to the Guardrails System.

---

## Explicit Decisions

Every validation produces a structured result.

---

## Defense In Depth

Validation can happen at multiple execution stages.

---

## Fail Safe

Unknown validation states should not silently allow risky operations.

---

## Extensible Policies

New policy types should be added without changing Runtime.

---

# 11. Edge Cases

The system should handle:

- missing policies,
- conflicting policies,
- invalid policy configuration,
- policy engine timeout,
- approval timeout,
- guardrail execution failure,
- unknown operation types,
- multiple simultaneous validation requests.

---

# 12. Future Enhancements

## Dynamic Policies

Policies loaded from external configuration.

---

## Context-Aware Policies

Rules based on:

- user role,
- environment,
- execution history.

---

## AI-Assisted Validation

Use a secondary model to review high-risk operations before approval.

---

## Policy Versioning

Support multiple policy versions for gradual rollout.

---

# Summary

The Guardrail Validation Flow ensures that every important operation passes through a dedicated safety layer before execution.

Complete flow:

```text
Runtime

↓

Guardrails Engine

↓

Policy Engine

↓

Decision

↓

Runtime

↓

Continue / Block / Approval
```

The guiding principle is:

> The Runtime executes work. The Guardrails System decides whether that work is allowed.
