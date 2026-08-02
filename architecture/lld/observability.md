# Observability Component — Low-Level Design (LLD)

**Project:** Agni SDK
**Component:** Observability System
**Document Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

The Observability System is responsible for recording, monitoring, and exposing everything that happens during an agent run.

It does **not** participate in agent execution.

Instead, it observes execution by listening to runtime events and building a complete picture of the system.

The primary goal of Observability is to answer questions such as:

- What happened?
- When did it happen?
- Why did it happen?
- How long did it take?
- Where did it fail?

Observability enables debugging, monitoring, auditing, and performance analysis without affecting the execution flow.

---

# Part A — Design Discussion

## 2. Intuition

Think of Observability as the **flight recorder (black box)** of an aircraft.

The pilot flies the airplane.

The flight recorder never controls the aircraft.

It simply records everything that happens.

Likewise:

- Runtime executes the Run.
- Providers communicate with LLMs.
- Tools perform actions.
- Memory retrieves information.
- Guardrails enforce safety.
- Observability records every important event.

---

## 3. Mental Model

```text
                  Runtime

                     │

              Event Bus

                     │

      ┌──────────────┼──────────────┐

      ▼              ▼              ▼

   Provider       Tools        Guardrails

                     │

               Emit Events

                     │

                     ▼

             Observability

      ┌──────────┬──────────┬──────────┐

      ▼          ▼          ▼

 Trace Builder  Logger     Metrics
```

Observability is a passive listener.

It never controls execution.

---

## 4. Why Observability Exists

Without observability:

```text
Agent Failed

↓

Unknown Reason
```

There is no visibility into execution.

With observability:

```text
Run Started

↓

Provider Called

↓

Memory Retrieved

↓

Tool Executed

↓

Run Completed
```

Every important operation is visible.

---

## 5. Design Reasoning

During HLD we identified several independent responsibilities:

- Runtime orchestrates execution.
- Provider communicates with models.
- Tool Registry executes tools.
- Memory manages persistence.
- Guardrails validate behavior.

One responsibility remained:

> Record everything that happens.

Rather than giving this responsibility to Runtime, a dedicated Observability System was introduced.

---

## 6. Why Observability Is Separate

Embedding logging and tracing into Runtime would cause it to own multiple unrelated responsibilities.

Example:

```text
Runtime

├── Execution
├── Logging
├── Metrics
├── Tracing
└── Monitoring
```

This violates the Single Responsibility Principle.

Instead:

```text
Runtime

↓

Emit Event

↓

Observability
```

Runtime focuses on execution.

Observability focuses on recording.

---

## 7. Event-Driven Design

Observability follows the **Observer Pattern**.

Execution components emit events.

Observability subscribes to those events.

Example:

```text
Runtime

↓

emit("tool.started")
```

Observability receives:

```text
tool.started

↓

Store Event

↓

Update Trace

↓

Record Metrics
```

This keeps the architecture loosely coupled.

---

# Part B — Internal Architecture

## 8. Internal Architecture

```text
                Event Bus

                    │

                    ▼

          Observability System

                    │

    ┌───────────────┼───────────────┐

    ▼               ▼               ▼

Trace Builder    Logger       Metrics Collector

                    │

                    ▼

             Trace Storage
```

---

## 9. Internal Components

### Event Listener

Receives events from the Event Bus.

---

### Trace Builder

Groups related events into a complete execution trace.

---

### Logger

Stores structured logs for debugging and auditing.

---

### Metrics Collector

Records measurements such as:

- execution duration,
- provider latency,
- tool execution time,
- retry count,
- token usage.

---

### Trace Storage

Maintains execution history for inspection and debugging.

---

# Part C — Formal LLD

## 10. Responsibilities

The Observability System owns:

- event collection,
- trace creation,
- structured logging,
- metrics collection,
- execution auditing,
- performance visibility.

---

## 11. Responsibilities Not Owned

Observability does **not** own:

- agent execution,
- provider communication,
- tool execution,
- memory retrieval,
- guardrail validation,
- business logic.

It never changes execution behavior.

---

## 12. State

Observability maintains runtime metadata.

Typical trace information includes:

- Trace ID,
- Run ID,
- Event timeline,
- Component name,
- Timestamp,
- Duration,
- Token usage,
- Error details,
- Metadata.

---

## 13. Interfaces

### Incoming

Observability receives events from:

- Runtime,
- Provider,
- Tool Registry,
- Memory,
- Guardrails.

---

### Outgoing

Observability exposes:

- traces,
- logs,
- metrics,
- execution history.

It does not invoke other execution components.

---

# 14. Event Categories

Typical events include:

## Runtime

- Run Started
- Run Completed
- Run Failed

---

## Provider

- Request Started
- Request Completed
- Retry
- Streaming Started
- Streaming Completed

---

## Tools

- Tool Selected
- Tool Started
- Tool Completed
- Tool Failed

---

## Memory

- Memory Retrieved
- Memory Stored

---

## Guardrails

- Validation Started
- Validation Completed
- Blocked
- Approval Required

---

## Streaming

- Token Received
- Stream Completed

---

# 15. Sequence Diagram

```text
Runtime

↓

Emit Event

↓

Event Bus

↓

Observability

↓

Trace Builder

↓

Logger

↓

Metrics Collector
```

---

# 16. Observability Lifecycle

```text
WAITING

↓

EVENT_RECEIVED

↓

PROCESSING

↓

TRACE_UPDATED

↓

LOG_WRITTEN

↓

METRICS_UPDATED

↓

WAITING
```

The Observability System continuously listens for new events.

---

# 17. Component Diagram

```text
               Observability

                    │

              Event Listener

                    │

      ┌─────────────┼─────────────┐

      ▼             ▼             ▼

 Trace Builder   Logger     Metrics Collector

                    │

                    ▼

             Trace Repository
```

---

# 18. Design Principles

## Passive Observation

Observability records execution.

It never controls execution.

---

## Loose Coupling

Components emit events.

They do not know who consumes them.

---

## Event-Driven Architecture

Communication happens through events rather than direct method calls.

---

## Structured Data

Logs and traces should be machine-readable.

---

## Extensibility

New event types can be introduced without changing Runtime.

---

# 19. Edge Cases

The Observability System should handle:

- duplicate events,
- missing events,
- out-of-order events,
- event listener failures,
- large traces,
- concurrent runs,
- partial traces,
- storage failures.

Observability failures should never interrupt agent execution.

---

# 20. Future Enhancements

Possible future capabilities include:

## Distributed Tracing

Track execution across multiple services.

---

## OpenTelemetry Integration

Export traces to external observability platforms.

---

## Live Monitoring Dashboard

Display active agent runs in real time.

---

## Performance Analytics

Analyze latency, retries, and token usage across runs.

---

## Trace Replay

Replay an entire agent execution for debugging.

---

# 21. Architectural Decisions

| Decision                         | Reason                                      |
| -------------------------------- | ------------------------------------------- |
| Separate Observability System    | Prevent Runtime from becoming a God Object. |
| Event-driven communication       | Loose coupling between components.          |
| Passive listener                 | Observability never changes execution.      |
| Trace built from events          | Components remain simple.                   |
| Structured logging               | Easier debugging and analytics.             |
| Metrics separated from execution | Keeps business logic independent.           |

---

# Summary

The Observability System is the monitoring layer of Agni SDK.

It does not execute work.

It does not make decisions.

It simply observes everything that happens.

Architecture:

```text
Runtime

↓

Event Bus

↓

Observability

↓

Events

↓

Traces

↓

Logs

↓

Metrics
```

By separating execution from observation, Agni SDK achieves a production-grade architecture that is easier to debug, monitor, and operate at scale.
