# ADR 005 — Guardrails Engine Architecture

**Project:** Agni SDK
**Decision ID:** ADR-005
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

AI agents are capable of reasoning and taking actions through tools.

However, LLMs are probabilistic systems.

They may:

- generate unsafe outputs,
- choose incorrect actions,
- misuse tools,
- expose sensitive information,
- violate application policies.

An agent system therefore requires a control layer that can validate and restrict behavior.

The Guardrails System provides this control layer.

---

# Problem

The main architectural questions:

1. Where should safety validation happen?
2. Should Guardrails be part of Runtime?
3. How should different validation types be handled?
4. Who defines safety rules?
5. How should guardrail decisions be represented?

---

# Decision Summary

Agni SDK will use a dedicated Guardrails Engine.

Architecture:

```text
                    Runtime

                       |

                       v

              Guardrails Engine


       ┌───────────────┼───────────────┐


       ▼               ▼               ▼


 Input Guardrails  Tool Guardrails  Output Guardrails


                       |

                       v


                Policy Engine
```

---

# Decision 1 — Guardrails Should Be Separate From Runtime

## Context

The Runtime is responsible for:

- execution lifecycle,
- coordinating components,
- managing runs.

The question:

Should Runtime also own safety logic?

---

# Option 1 — Guardrails Inside Runtime

Architecture:

```text
Runtime

├── Execution Loop

├── Provider Calls

├── Tool Handling

└── Safety Rules
```

---

## Advantages

- Fewer components.
- Easy initial implementation.

---

## Problems

Runtime becomes responsible for:

```
Execution

+

Security

+

Validation

+

Policy Management
```

This creates a God Object.

Example:

```text
Runtime knows:

how agents run

how tools execute

how memory works

how safety works
```

---

## Decision

Rejected.

---

# Option 2 — Dedicated Guardrails Engine

Architecture:

```text
Runtime

↓

Guardrails Engine

↓

Decision
```

---

## Advantages

- Clear responsibility.
- Independent testing.
- Easier policy changes.
- Better extensibility.

---

## Decision

Accepted.

---

# Consequence

Runtime remains an orchestrator.

It only asks:

```
Can this action continue?
```

Guardrails answers:

```
Allowed / Blocked / Approval Required
```

---

# Decision 2 — Multiple Guardrail Types

## Context

Agent execution has multiple risk points.

Example:

```
User Input

↓

LLM Reasoning

↓

Tool Execution

↓

Final Response
```

A single validation step is insufficient.

---

# Option 1 — Single Global Guardrail

Architecture:

```
Guardrail

↓

Check Everything
```

---

## Problems

- Difficult to customize.
- Different checks have different requirements.

Example:

Input validation and payment authorization are not the same.

---

## Decision

Rejected.

---

# Option 2 — Specialized Guardrails

Architecture:

```
Guardrails Engine

├── Input Guardrails

├── Tool Guardrails

└── Output Guardrails
```

---

## Advantages

Each guardrail owns one responsibility.

---

## Decision

Accepted.

---

# Consequence

New guardrail types can be added later.

Example:

```
Future:

├── Privacy Guardrails

├── Cost Guardrails

└── Compliance Guardrails
```

---

# Decision 3 — Tool Guardrails Are Required

## Context

Tools allow agents to affect external systems.

Examples:

```
sendEmail()

deleteData()

makePayment()
```

A wrong model decision can create real-world impact.

---

# Option 1 — Trust Tool Calls

Flow:

```
LLM

↓

Tool

↓

Execute
```

---

## Problems

The LLM becomes the authorization layer.

This is unsafe.

---

## Decision

Rejected.

---

# Option 2 — Validate Tool Calls

Flow:

```
LLM

↓

Tool Guardrail

↓

Approve / Reject

↓

Execute
```

---

## Advantages

Provides:

- permission checks,
- parameter validation,
- approval workflows.

---

## Decision

Accepted.

---

# Decision 4 — Developer Defined Policies

## Context

Guardrails require rules.

Who creates them?

---

# Option 1 — Hardcoded SDK Rules

Example:

```
Payment > $1000 blocked
```

---

## Problems

Different applications have different requirements.

---

## Decision

Rejected.

---

# Option 2 — Developer Policies

Example:

```text
Payment Tool

Maximum Amount:
1000

Approval:
Required
```

---

## Advantages

- Flexible.
- Application specific.
- Easy to update.

---

## Decision

Accepted.

---

# Decision 5 — Guardrail Result Should Be More Than Boolean

## Context

A simple boolean:

```text
true / false
```

does not provide enough information.

Debugging requires knowing:

- why blocked,
- which rule triggered,
- what action was taken.

---

# Option 1 — Boolean Result

Example:

```
allowed = false
```

---

## Problems

No explanation.

---

## Decision

Rejected.

---

# Option 2 — Decision Object

Example:

```text
{
 status: BLOCKED,

 reason:
 "Sensitive information detected",

 rule:
 "privacy-policy"
}
```

---

## Advantages

Provides:

- observability,
- debugging,
- auditability.

---

## Decision

Accepted.

---

# Decision 6 — Multiple Validation Checkpoints

## Context

Agents have different stages.

A single checkpoint cannot protect everything.

---

# Decision

Use defense-in-depth.

Architecture:

```
User Input

↓

Input Guardrail

↓

Agent Execution

↓

Tool Guardrail

↓

Tool Result

↓

Output Guardrail

↓

User
```

---

# Consequence

Unsafe behavior can be stopped at multiple points.

---

# Architectural Rules

## Rule 1

Runtime must not contain policy logic.

---

## Rule 2

All safety decisions go through Guardrails Engine.

---

## Rule 3

Tools must be validated before execution.

---

## Rule 4

Guardrail decisions must be observable.

---

## Rule 5

Policies should be configurable by developers.

---

# Impact On Other Components

---

# Runtime

Integration:

```
Runtime

↓

Guardrails Engine

↓

Decision
```

Runtime only controls flow.

---

# Tools

Tool execution requires:

```
Tool Request

↓

Tool Guardrail

↓

Execution
```

---

# Provider

Provider is unaware of guardrails.

It only generates responses.

---

# Memory

Future integration:

Prevent storing:

- secrets,
- sensitive information,
- invalid data.

---

# Consequences

## Positive Consequences

### Safer Agents

Actions are validated before execution.

---

### Better Control

Developers define application-specific rules.

---

### Extensible Design

New policies can be added without changing Runtime.

---

### Better Debugging

Decisions contain reasons.

---

## Negative Consequences

### Additional Complexity

More components are introduced.

Instead of:

```
LLM

↓

Action
```

we have:

```
LLM

↓

Guardrail Check

↓

Action
```

---

### Additional Latency

Validation adds processing time.

---

# Final Decision Table

| Decision                   | Result   |
| -------------------------- | -------- |
| Guardrails inside Runtime  | Rejected |
| Separate Guardrails Engine | Accepted |
| Single global guardrail    | Rejected |
| Specialized guardrails     | Accepted |
| Trust LLM tool decisions   | Rejected |
| Validate tool calls        | Accepted |
| Hardcoded policies         | Rejected |
| Developer-defined policies | Accepted |
| Boolean result             | Rejected |
| Decision object            | Accepted |
| Single checkpoint          | Rejected |
| Multiple checkpoints       | Accepted |

---

# Final Statement

The Guardrails Engine provides a dedicated safety boundary around AI agent execution.

The architecture separates:

```
Runtime
=
Execution Control


Guardrails
=
Behavior Control


LLM
=
Reasoning
```

By keeping safety decisions independent from execution, Agni SDK can support powerful agents while maintaining predictable and controllable behavior.
