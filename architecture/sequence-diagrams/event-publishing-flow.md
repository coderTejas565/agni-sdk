# Event Publishing Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Observability System
**Diagram:** Event Publishing Flow
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how execution events are published throughout Agni SDK and how those events are delivered to the Observability System.

Rather than allowing execution components to communicate directly with loggers, metrics collectors, or trace builders, Agni SDK uses an event-driven architecture.

Execution components publish events.

The Event Bus distributes those events.

Observability consumes the events.

---

# 2. Why Event Publishing Exists

Without an event system:

```text id="k2fr7c"
Runtime

↓

Logger

↓

Metrics

↓

Trace Builder
```

Every execution component becomes tightly coupled to multiple observability services.

As more services are introduced, every component must be modified.

---

With an Event Bus:

```text id="t5xj9w"
Runtime

↓

Event Bus

↓

Observability
```

Execution components only publish events.

They never know who receives them.

---

# 3. Actors

```text id="a6qh1d"
Runtime

Provider

Tool Registry

Memory

Guardrails

↓

Event Bus

↓

Observability

↓

Logger

Trace Builder

Metrics Collector
```

---

# 4. High-Level Flow

```text id="m4uv8n"
Execution Component

↓

Publish Event

↓

Event Bus

↓

Observability

↓

Process Event
```

---

# 5. Complete Sequence Diagram

```text id="f3rq7y"
                  Runtime

                     │

                     ▼

             Execute Operation

                     │

                     ▼

        Publish Execution Event

                     │

                     ▼

                 Event Bus

                     │

      ┌──────────────┼──────────────┐

      ▼              ▼              ▼

Trace Builder     Logger     Metrics Collector

      │              │              │

      └──────────────┼──────────────┘

                     ▼

             Event Processed
```

---

# 6. Detailed Execution Flow

## Step 1 — Component Completes an Operation

An execution component reaches a significant point.

Examples:

- Run starts.
- Provider request completes.
- Tool execution begins.
- Memory retrieval finishes.
- Guardrail blocks a request.

The component creates an event.

Example:

```text id="y4bwk8"
Event

Name:
tool.started

Run ID:
run-123

Timestamp:
10:42:11.231
```

---

## Step 2 — Event Is Published

The component publishes the event.

```text id="w7t2cr"
Runtime

↓

emit(event)
```

The component does not wait for any listener to finish processing.

Publishing should be lightweight and non-blocking.

---

## Step 3 — Event Bus Receives Event

The Event Bus becomes responsible for distribution.

```text id="9g0aqm"
Event Bus

↓

Receive Event

↓

Notify Subscribers
```

The publisher has no knowledge of subscribers.

---

## Step 4 — Event Is Delivered

The Event Bus delivers the same event to every interested listener.

```text id="t3mr8z"
Event

↓

Trace Builder

↓

Logger

↓

Metrics Collector
```

Every listener receives identical event data.

---

## Step 5 — Independent Processing

Each listener performs its own work.

### Trace Builder

```text id="tg8j96"
Receive Event

↓

Append To Trace
```

---

### Logger

```text id="6z67nx"
Receive Event

↓

Write Structured Log
```

---

### Metrics Collector

```text id="mxk8z5"
Receive Event

↓

Update Counters

↓

Record Duration
```

Each listener operates independently.

---

## Step 6 — Execution Continues

Execution components continue their work immediately after publishing.

```text id="c3uzw7"
Publish Event

↓

Continue Execution
```

The execution pipeline never waits for observability work to complete.

---

# 7. Example Event Timeline

```text id="0z3kqn"
run.started

↓

provider.request.started

↓

provider.request.completed

↓

tool.selected

↓

tool.started

↓

tool.completed

↓

provider.request.started

↓

provider.request.completed

↓

run.completed
```

Each event is published independently.

---

# 8. Event Structure

Every published event should contain common metadata.

Typical fields include:

```text id="vv6fsy"
Event ID

Run ID

Event Name

Component

Timestamp

Duration

Metadata

Error (optional)
```

Individual event types may include additional fields.

---

# 9. Responsibility Boundaries

## Execution Components

Responsible for:

- creating events,
- publishing events.

Never responsible for:

- logging,
- trace construction,
- metrics.

---

## Event Bus

Responsible for:

- receiving events,
- distributing events,
- managing subscribers.

Never interprets event meaning.

---

## Observability

Responsible for:

- consuming events,
- recording execution history,
- building traces,
- collecting metrics.

Never influences execution.

---

# 10. Failure Scenarios

## No Subscribers

```text id="h0zvjh"
Publish Event

↓

No Listeners

↓

Continue Execution
```

Publishing should still succeed.

---

## Listener Failure

```text id="kmj0rj"
Event

↓

Logger

↓

Exception
```

Other listeners continue processing.

A failing listener must not prevent event delivery to others.

---

## Event Bus Failure

If the Event Bus becomes unavailable:

```text id="c5zzqg"
Publish Event

↓

Failure
```

The SDK should:

- record the failure if possible,
- avoid crashing the Runtime,
- continue execution whenever safe.

---

## Duplicate Events

Listeners should tolerate duplicate events.

Processing should be idempotent whenever practical.

---

# 11. Design Principles

## Loose Coupling

Publishers know nothing about subscribers.

---

## Asynchronous Communication

Event publication should not block execution.

---

## Single Source of Truth

Events represent immutable facts.

They should never be modified after publication.

---

## Multiple Consumers

One event can be consumed by many independent systems.

---

## Extensibility

New subscribers can be added without changing execution components.

Examples:

- OpenTelemetry exporter,
- analytics pipeline,
- audit logger,
- live dashboard.

---

# 12. Future Enhancements

## Event Filtering

Allow subscribers to receive only selected event categories.

---

## Priority Events

Support different delivery priorities.

---

## Distributed Event Bus

Publish events across multiple processes or services.

---

## Persistent Event Store

Persist events for replay and recovery.

---

# Summary

The Event Publishing Flow defines how execution components communicate with the Observability System.

Complete flow:

```text id="yn8n0d"
Execution Component

↓

Publish Event

↓

Event Bus

↓

Observability

↓

Logger

↓

Trace Builder

↓

Metrics Collector
```

The guiding principle is:

> Execution components publish facts. Observability decides how those facts are recorded and analyzed.
