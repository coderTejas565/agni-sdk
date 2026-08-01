# ADR 001 — Runtime as an Orchestrator

**Project:** Agni SDK
**Decision ID:** ADR-001
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

An AI Agent SDK requires multiple capabilities to complete an agent execution.

A single user request may involve:

- communicating with an LLM,
- executing tools,
- loading memory,
- validating actions,
- handling failures,
- tracking execution.

The first architectural question was:

> Who should own the responsibility of coordinating these operations?

A naive approach would place all responsibilities inside a single Runtime component.

However, as the SDK grows, this approach creates tight coupling and makes the system difficult to extend.

---

# Problem

The Agent SDK requires a central execution layer.

This layer must:

- manage execution lifecycle,
- coordinate multiple components,
- handle multi-step workflows,
- maintain execution flow.

The challenge is deciding whether this layer should:

1. Implement all capabilities itself.
2. Coordinate specialized components.

---

# Decision

The Runtime will be designed as an **orchestration layer**.

The Runtime owns:

- Run lifecycle.
- Execution flow.
- Component coordination.
- State transitions.

The Runtime delegates specialized responsibilities to independent components.

```text
                         Runtime

                            |

      ┌─────────────┬─────────────┬─────────────┐

      ▼             ▼             ▼

  Provider       Tools        Memory

      ▼             ▼             ▼

    LLM       External APIs   Storage
```

The Runtime acts as the coordinator, not the executor.

---

# Alternatives Considered

## Alternative 1 — Monolithic Runtime

### Architecture

```text
Runtime

├── LLM Calls
├── Tool Execution
├── Memory Handling
├── Validation
├── Logging
└── Error Handling
```

---

### Advantages

- Simple initial implementation.
- Fewer components.
- Faster prototype development.

---

### Disadvantages

## Poor Separation of Concerns

The Runtime becomes responsible for unrelated responsibilities.

Example:

```text
Runtime

knows about:

OpenAI API
Database
Weather API
Validation Rules
Logging
```

---

## Difficult Testing

Testing one behavior requires testing the entire system.

---

## Difficult Extension

Adding a new feature requires modifying Runtime.

Example:

Adding Claude support:

```text
Modify Runtime

↓

Risk breaking existing behavior
```

---

## God Object Problem

Over time Runtime becomes a large component that controls everything.

---

### Decision

Rejected.

---

# Alternative 2 — Runtime as an Orchestrator

### Architecture

```text
Runtime

↓

Specialized Components

├── Provider
├── Tool Manager
├── Memory
├── Guardrails
└── Observability
```

---

### Advantages

## Clear Ownership

Each component owns one responsibility.

Example:

Provider:

> Communicate with AI models.

Memory:

> Store and retrieve state.

Tools:

> Execute external capabilities.

Runtime:

> Coordinate execution.

---

## Better Extensibility

New capabilities can be added independently.

Example:

Adding a new model provider:

```text
Add New Provider

↓

No Runtime Changes
```

---

## Better Testing

Components can be tested independently.

---

## Better Maintainability

The system can evolve without creating unnecessary coupling.

---

### Decision

Accepted.

---

# Consequences

## Positive Consequences

### Modular Architecture

Each subsystem can evolve independently.

---

### Provider Independence

The SDK can support:

- OpenAI
- Claude
- Gemini
- Future providers

without changing execution logic.

---

### Easier Feature Development

New capabilities can be introduced as new components.

Examples:

- New memory systems.
- New guardrails.
- New tools.

---

### Better Developer Experience

The complexity of execution remains hidden from SDK users.

---

# Negative Consequences

## More Initial Complexity

The architecture requires more components.

Instead of:

```text
Runtime
```

we have:

```text
Runtime

├── Provider

├── Tools

├── Memory

├── Guardrails

└── Observability
```

---

## More Interface Design Required

Components need clear contracts.

Poor interfaces can create unnecessary complexity.

---

# Design Principles Behind This Decision

This decision follows:

## Single Responsibility Principle

Each component should have one primary responsibility.

---

## Separation of Concerns

Execution coordination is separated from execution capability.

---

## Dependency Inversion

Runtime depends on abstractions rather than concrete implementations.

---

## Open/Closed Principle

The system should allow new capabilities without modifying existing core behavior.

---

# Impact on Future Architecture

This decision influences the design of all future components.

## Provider Layer

Provider will only handle model communication.

It will not manage execution flow.

---

## Tool System

Tools will only execute capabilities.

They will not decide when they should run.

---

## Memory System

Memory will store and retrieve state.

It will not control agent behavior.

---

## Guardrails

Guardrails will validate actions.

They will not control execution lifecycle.

---

# Final Decision Summary

| Decision                                           | Result   |
| -------------------------------------------------- | -------- |
| Runtime owns execution lifecycle                   | Accepted |
| Runtime performs specialized work                  | Rejected |
| Components have independent responsibilities       | Accepted |
| Runtime acts as orchestration layer                | Accepted |
| Specialized systems communicate through boundaries | Accepted |

---

# Final Statement

The Runtime is designed as an orchestrator because an AI agent is not a single operation.

It is a coordinated workflow involving reasoning, tools, memory, safety, and state.

By making Runtime responsible for coordination rather than implementation, Agni SDK achieves a scalable architecture where new capabilities can be added without destabilizing the core execution engine.
