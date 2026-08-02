# ADR 006 — Observability System Architecture

**Project:** Agni SDK
**Decision ID:** ADR-006
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

AI agent execution is significantly more complex than a traditional request-response application.

A single agent run may involve:

- multiple model calls,
- tool executions,
- memory retrieval,
- guardrail validation,
- retries,
- streaming responses,
- handoffs between agents.

As the SDK grows, developers need visibility into the execution process to debug failures, analyze performance, and understand agent behavior.

The architecture therefore requires a dedicated observability system.

---

# Problem

The primary architectural questions were:

1. Should Runtime own logging and tracing?
2. How should execution events be collected?
3. Should components communicate directly with Observability?
4. How should execution traces be created?
5. What information should be recorded?

---

# Decision Summary

Agni SDK will use a dedicated **Observability System** that passively listens to execution events.

Architecture:

```text
                    Runtime

                        │

                 Event Bus

                        │

        ┌───────────────┼───────────────┐

        ▼               ▼               ▼

    Provider      Tool Registry      Memory

        │               │               │

        └───────────────┼───────────────┘

                        │

                  Guardrails

                        │

                  Emit Events

                        │

                        ▼

             Observability System

        ┌────────────┬────────────┬────────────┐

        ▼            ▼            ▼

 Trace Builder     Logger       Metrics
```

The execution pipeline and the observability pipeline remain independent.

---

# Decision 1 — Observability Must Be a Separate Component

## Context

The Runtime already owns:

- execution lifecycle,
- run coordination,
- component orchestration.

The question:

Should Runtime also perform logging, tracing, and metrics collection?

---

# Option 1 — Runtime Owns Observability

Architecture:

```text
Runtime

├── Execution
├── Logging
├── Metrics
└── Tracing
```

---

## Advantages

- Fewer components.
- Simple implementation for small projects.

---

## Problems

Runtime now owns unrelated responsibilities.

This violates the Single Responsibility Principle.

As observability grows, Runtime becomes difficult to maintain and test.

---

## Decision

Rejected.

---

# Option 2 — Dedicated Observability System

Architecture:

```text
Runtime

↓

Emit Events

↓

Observability
```

---

## Advantages

- Clear separation of concerns.
- Independent evolution.
- Easier testing.
- Reusable across future components.

---

## Decision

Accepted.

---

# Consequence

Runtime remains responsible only for execution.

Observability remains responsible only for observation.

---

# Decision 2 — Event-Driven Communication

## Context

Execution components need to notify Observability.

How should this communication happen?

---

# Option 1 — Direct Method Calls

Example:

```text
Runtime

↓

observability.log(...)
```

---

## Problems

Every execution component must know the Observability API.

This increases coupling.

---

## Decision

Rejected.

---

# Option 2 — Event Bus

Example:

```text
Runtime

↓

emit(run.started)
```

Observability subscribes to events.

---

## Advantages

- Loose coupling.
- New listeners can be added without modifying Runtime.
- Follows the Observer Pattern.

---

## Decision

Accepted.

---

# Consequence

Execution components are unaware of who consumes their events.

---

# Decision 3 — Components Emit Events, Not Traces

## Context

Should Runtime and other components build execution traces directly?

---

# Option 1 — Components Build Traces

Example:

```text
Runtime

↓

Update Trace
```

---

## Problems

Every component would require knowledge of trace structures.

Trace management becomes duplicated.

---

## Decision

Rejected.

---

# Option 2 — Components Emit Events

Example:

```text
tool.started

provider.completed

memory.loaded
```

The Trace Builder assembles the complete execution timeline.

---

## Advantages

- Components remain simple.
- Trace construction is centralized.
- New event types are automatically included.

---

## Decision

Accepted.

---

# Consequence

Many events become one execution trace.

---

# Decision 4 — Observability Is Passive

## Context

Should Observability influence execution?

---

# Decision

No.

Observability must never:

- retry providers,
- cancel execution,
- approve tools,
- modify memory,
- change Runtime state.

It only records what has already happened.

---

# Consequence

Execution remains deterministic.

Observability failures cannot alter business behavior.

---

# Decision 5 — Unified Observability

## Context

Logging, tracing, and metrics are closely related.

Should they be separate systems?

---

# Option 1 — Independent Systems

```text
Logger

Metrics

Tracing
```

---

## Problems

- Duplicate processing.
- Multiple event subscriptions.
- Difficult correlation.

---

## Decision

Rejected.

---

# Option 2 — Unified Observability

```text
Observability

├── Logger
├── Metrics
└── Trace Builder
```

---

## Advantages

- Single event pipeline.
- Shared metadata.
- Consistent execution history.

---

## Decision

Accepted.

---

# Architectural Rules

## Rule 1

Runtime must never depend directly on Logger or Metrics.

---

## Rule 2

All execution components communicate through the Event Bus.

---

## Rule 3

Observability must never modify execution state.

---

## Rule 4

Execution events are immutable.

Once published, they represent historical facts.

---

## Rule 5

A Trace is constructed from multiple events.

Individual components never own trace construction.

---

# Impact On Other Components

## Runtime

Runtime emits lifecycle events.

It never writes logs directly.

---

## Provider

Provider emits request and response events.

It does not know who consumes them.

---

## Tool Registry

Publishes tool execution events.

---

## Memory

Publishes retrieval and storage events.

---

## Guardrails

Publishes validation and policy decision events.

---

# Consequences

## Positive Consequences

### Loose Coupling

Execution remains independent from monitoring.

---

### Extensibility

New listeners can be added without changing Runtime.

Examples:

- analytics,
- dashboards,
- OpenTelemetry exporters,
- audit systems.

---

### Better Debugging

Every Run can be reconstructed from recorded events.

---

### Production Monitoring

Metrics such as latency, retries, and token usage become available.

---

## Negative Consequences

### Additional Infrastructure

An Event Bus and Observability pipeline must be maintained.

---

### Event Ordering

Trace construction depends on correctly ordered events.

The Trace Builder must handle out-of-order or missing events gracefully.

---

### Storage Overhead

Large systems may generate significant volumes of events and traces.

Retention and archival strategies become important.

---

# Final Decision Table

| Decision                         | Result   |
| -------------------------------- | -------- |
| Runtime owns logging             | Rejected |
| Dedicated Observability System   | Accepted |
| Direct communication             | Rejected |
| Event Bus                        | Accepted |
| Components build traces          | Rejected |
| Trace Builder assembles traces   | Accepted |
| Observability modifies execution | Rejected |
| Passive observation              | Accepted |
| Separate logging/tracing systems | Rejected |
| Unified Observability System     | Accepted |

---

# Final Statement

The Observability System provides visibility into every agent execution without participating in the execution itself.

The architecture intentionally separates execution from observation.

```text
Execution

Runtime

↓

Provider

↓

Tools

↓

Memory

↓

Guardrails


Observation

Events

↓

Observability

↓

Traces

↓

Logs

↓

Metrics
```

By adopting an event-driven, passive observability architecture, Agni SDK remains modular, production-ready, and scalable while giving developers complete insight into every agent run.
