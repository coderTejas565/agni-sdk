# Guardrails Component — Low-Level Design (LLD)

**Project:** Agni SDK
**Component:** Guardrails System
**Document Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

The Guardrails System is the safety and control layer of the Agni SDK.

It is responsible for validating, controlling, and restricting agent behavior before, during, and after execution.

AI agents are probabilistic systems.

They can:

- generate unexpected responses,
- select incorrect tools,
- produce unsafe outputs,
- perform unauthorized actions.

Guardrails exist to ensure that agent behavior follows defined rules and policies.

---

The Guardrails System provides:

```text
 id="8w9f1m"
Safety

+

Validation

+

Policy Enforcement

+

Control
```

---

# Part A — Design Discussion

# 2. Intuition

Guardrails should be considered as security checkpoints around an agent.

They are not the intelligence layer.

They do not decide what the agent should do.

They decide:

> "Is this action allowed?"

---

Human analogy:

Before entering a secure building:

```text
 id="p5x2rq"
Person

↓

Identity Check

↓

Permission Check

↓

Access Granted
```

Agent:

```text
 id="m7v3ks"
Input

↓

Input Guardrail

↓

Agent Execution

↓

Tool Guardrail

↓

Output Guardrail

↓

Response
```

---

# 3. Mental Model

The Guardrails System works as a control layer.

```text
 id="q8n5yt"
                     Runtime


                         |

                         v


                 Guardrails Engine


        ┌────────────────┼────────────────┐


        ▼                ▼                ▼


 Input Validation   Tool Validation   Output Validation


                         |

                         v


                    Policy Rules
```

---

# 4. Why Guardrails Exist

Without guardrails:

```text
 id="r4z7km"
User

↓

LLM

↓

Action

↓

External Impact
```

The model directly influences the world.

---

With guardrails:

```text
 id="c6y1pt"
User

↓

LLM

↓

Guardrail Check

↓

Allowed?

↓

Action
```

The system gets a control point.

---

# 5. Design Reasoning

During HLD we identified:

Runtime manages execution.

Provider manages model communication.

Tools manage actions.

Memory manages knowledge.

A missing responsibility remained:

> Who ensures the agent behaves safely?

Therefore:

A dedicated Guardrails component is required.

---

# 6. Why Guardrails Is Separate

Without a separate system:

```text
 id="s9k3lm"
Runtime

├── Execution

├── Memory

├── Tools

└── Safety Rules
```

The Runtime becomes responsible for everything.

Problems:

- difficult testing,
- difficult customization,
- difficult policy changes,
- violates separation of concerns.

---

With separate Guardrails:

```text
 id="d3q7vx"
Runtime

↓

Guardrails Engine

↓

Decision
```

Runtime remains an orchestrator.

---

# 7. Guardrail Types

Agni SDK supports multiple guardrail categories.

---

# Input Guardrails

Purpose:

Validate user input before execution.

Examples:

- unsafe requests,
- invalid input,
- malicious instructions.

Flow:

```text
 id="h4z8pn"
User Input

↓

Input Guardrail

↓

Runtime
```

---

# Tool Guardrails

Purpose:

Control tool execution.

Tools can create real-world impact.

Examples:

- payments,
- emails,
- database operations.

Flow:

```text
 id="e6w2ky"
LLM Selects Tool

↓

Tool Guardrail

↓

Execute / Reject
```

---

# Output Guardrails

Purpose:

Validate generated responses.

Examples:

- sensitive information,
- unsupported claims,
- policy violations.

Flow:

```text
 id="z5n9rx"
LLM Response

↓

Output Guardrail

↓

User
```

---

# Policy Guardrails

Purpose:

Apply developer-defined rules.

Examples:

```text
 id="u3m8qp"
Payment Tool

Maximum Amount:
$1000

Requires Approval:
true
```

---

# 8. Guardrail Execution Strategy

Guardrails operate at multiple checkpoints.

```text
 id="k6p2mv"
User Request

↓

Input Guardrail

↓

Agent Execution

↓

Tool Call

↓

Tool Guardrail

↓

Tool Result

↓

Final Response

↓

Output Guardrail
```

---

# 9. Guardrail Decision Model

Guardrails should not only return true or false.

They return a decision object.

Example:

```text
 id="x9m4kp"
Guardrail Result


{
 status:
   ALLOWED,


 reason:
   "Passed security policy"
}
```

---

Blocked example:

```text
 id="a7q2zn"
{
 status:
   BLOCKED,


 reason:
   "Sensitive information detected"
}
```

---

# Part B — Internal Architecture

# 10. Guardrails Architecture

```text
 id="j5x8qm"
                         Runtime


                            |


                            v


                   Guardrails Engine


          ┌─────────────────┼─────────────────┐


          ▼                 ▼                 ▼


 Input Guardrails     Tool Guardrails   Output Guardrails


          |                 |                 |


          └─────────────────┼─────────────────┘


                            |


                            v


                    Policy Engine
```

---

# 11. Internal Components

---

# Guardrails Engine

Central coordinator.

Responsibilities:

- execute checks,
- collect decisions,
- return validation results.

---

# Input Guardrail Manager

Responsible for:

- validating user requests,
- detecting invalid input.

---

# Tool Guardrail Manager

Responsible for:

- validating tool calls,
- checking permissions,
- requiring approval.

---

# Output Guardrail Manager

Responsible for:

- validating final responses,
- removing unsafe content.

---

# Policy Engine

Responsible for:

- storing rules,
- evaluating conditions,
- enforcing developer policies.

---

# Part C — Formal LLD

# 12. Responsibilities

The Guardrails System owns:

- input validation,
- output validation,
- tool authorization,
- policy evaluation,
- approval workflows,
- safety decisions.

---

# 13. Responsibilities Not Owned

Guardrails does not own:

- agent reasoning,
- LLM communication,
- tool execution,
- memory storage,
- execution flow.

---

# 14. State

The Guardrails System maintains:

## Guardrail Check State

Contains:

```text
 id="p8y4mz"
Check ID

Target Type

Rule Applied

Result

Timestamp
```

---

## Decision State

Possible results:

```text
 id="w3n7qx"
PENDING

ALLOWED

BLOCKED

REQUIRES_APPROVAL

FAILED
```

---

# 15. Interfaces

## Incoming

Guardrails receives:

- input data,
- tool request,
- model output,
- execution context,
- active policies.

---

## Outgoing

Guardrails returns:

- allow decision,
- block decision,
- modified output,
- approval request.

---

# 16. Sequence Diagram

High-level:

```text
 id="z8m3kv"
Runtime

 |

 | Check Request

 v


Guardrails Engine

 |

 | Evaluate Rules

 v


Policy Engine

 |

 | Decision

 v


Guardrails Engine

 |

 | Result

 v


Runtime
```

---

# 17. Guardrail Lifecycle

```text
 id="f6q2ws"
CREATED

↓

CHECKING

↓

EVALUATING

↓

DECIDED


     |

 ┌───┼────┐

 ▼   ▼    ▼


ALLOW BLOCK APPROVAL


     |

     v


 COMPLETED
```

---

# 18. Component Diagram

```text
 id="y7k4mp"
                    Guardrails System


                           |


                    Guardrails Engine


          ┌────────────────┼────────────────┐


          ▼                ▼                ▼


 Input Manager      Tool Manager     Output Manager


                           |


                           v


                    Policy Engine


                           |


                           v


                    Policy Storage
```

---

# 19. Design Principles

---

## Separation of Concerns

Guardrails controls behavior.

Runtime controls execution.

---

## Defense in Depth

Multiple checkpoints:

- before execution,
- during execution,
- after execution.

---

## Explicit Policies

Rules should be visible and configurable.

---

## Fail Safe

Unknown situations should not silently allow dangerous actions.

---

## Extensibility

New guardrail types should be added without modifying Runtime.

---

# 20. Edge Cases

The Guardrails System should handle:

- guardrail execution failure,
- conflicting policies,
- missing policies,
- tool approval timeout,
- invalid tool arguments,
- unsafe outputs,
- false positives,
- false negatives,
- policy update during execution.

---

# 21. Future Extensions

Possible improvements:

## Human Approval Workflows

Example:

```text
Agent

↓

Approval Request

↓

Human Decision

↓

Continue
```

---

## AI-Based Validators

Use another model to review outputs.

---

## Policy Marketplace

Allow reusable safety policies.

---

## Audit Logging

Track every guardrail decision.

---

# 22. Architectural Decisions

| Decision                           | Reason                                                |
| ---------------------------------- | ----------------------------------------------------- |
| Separate Guardrails System         | Prevent Runtime from becoming a God Object.           |
| Multiple guardrail types           | Different execution stages need different validation. |
| Tool guardrails                    | Tools can create external impact.                     |
| Policy-based design                | Allows developer customization.                       |
| Decision object instead of boolean | Provides reasoning and debugging information.         |
| Multiple checkpoints               | Provides defense in depth.                            |

---

# Summary

The Guardrails System provides safety and control for Agni SDK agents.

The architecture separates:

```text
 id="m5q8nv"
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

By placing validation outside the Runtime, Agni SDK keeps execution modular while allowing developers to define strong safety boundaries around agent behavior.
