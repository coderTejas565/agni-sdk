# Trace Creation Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Observability System
**Diagram:** Trace Creation Flow
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how Agni SDK constructs a complete execution trace from individual runtime events.

A single agent run produces many independent events.

The Trace Builder groups those events into one coherent execution timeline.

This trace becomes the complete history of a Run and serves as the foundation for debugging, auditing, performance analysis, and future integrations such as OpenTelemetry.

---

# 2. Why Trace Creation Exists

Execution is not a single action.

An agent run may involve:

- provider requests,
- tool executions,
- memory retrieval,
- guardrail validation,
- retries,
- streaming,
- handoffs.

Each step generates an event.

Without trace creation:

```text
run.started

provider.started

provider.completed

tool.started

tool.completed

run.completed
```

The events remain isolated.

There is no execution story.

With trace creation:

```text
Run Trace

↓

Run Started

↓

Provider Request

↓

Tool Execution

↓

Provider Request

↓

Run Completed
```

Every event becomes part of one execution timeline.

---

# 3. Mental Model

Think of each event as a single frame in a movie.

```text
Frame 1

Frame 2

Frame 3

Frame 4
```

One frame tells very little.

When played together:

```text
Frames

↓

Timeline

↓

Movie
```

A Trace is the movie of an agent run.

---

# 4. Actors

```text
Runtime

Provider

Tool Registry

Memory

Guardrails

↓

Event Bus

↓

Trace Builder

↓

Trace Repository
```

---

# 5. High-Level Flow

```text
Execution Components

↓

Publish Events

↓

Event Bus

↓

Trace Builder

↓

Execution Trace

↓

Trace Repository
```

---

# 6. Complete Sequence Diagram

```text
Runtime

↓

Publish Event

↓

Event Bus

↓

Trace Builder

↓

Locate Trace (Run ID)

↓

Append Event

↓

Update Timeline

↓

Persist Trace

↓

Ready For Next Event
```

This sequence repeats for every event generated during the Run.

---

# 7. Detailed Execution Flow

## Step 1 — Run Begins

The Runtime starts a new execution.

Example event:

```text
run.started
```

Metadata:

- Run ID
- Agent Name
- Timestamp

The event is published to the Event Bus.

---

## Step 2 — Trace Builder Receives Event

The Trace Builder receives the event.

```text
run.started

↓

Trace Builder
```

It extracts the Run ID.

If no trace exists for that Run ID, a new trace is created.

---

## Step 3 — Create Trace

A new trace is initialized.

Example:

```text
Trace

Run ID:
run-123

Status:
Running

Events:
[]
```

The first event is appended.

---

## Step 4 — More Events Arrive

Execution continues.

Example:

```text
provider.request.started

↓

provider.request.completed

↓

tool.started

↓

tool.completed

↓

memory.retrieved
```

Each event is processed independently.

---

## Step 5 — Append Event

For every incoming event:

```text
Receive Event

↓

Locate Trace

↓

Append Event

↓

Update Metadata
```

The Trace Builder never replaces earlier events.

Events are append-only.

---

## Step 6 — Update Trace Metadata

As events arrive, aggregate information may be updated.

Examples:

- total provider calls,
- tool count,
- retry count,
- execution duration,
- total tokens,
- final status.

This enables quick summaries without scanning every event.

---

## Step 7 — Run Completes

Runtime publishes:

```text
run.completed
```

The Trace Builder:

- appends the final event,
- calculates total duration,
- marks the trace as completed.

Example:

```text
Status:
Completed

Duration:
2.8s
```

The trace is now finalized.

---

# 8. Example Trace Timeline

```text
Run Started

↓

Memory Retrieved

↓

Provider Request Started

↓

Provider Request Completed

↓

Tool Selected

↓

Tool Started

↓

Tool Completed

↓

Provider Request Started

↓

Provider Request Completed

↓

Run Completed
```

This ordered timeline represents one complete execution.

---

# 9. Trace Structure

A trace typically contains:

```text
Trace

├── Trace ID
├── Run ID
├── Agent Name
├── Status
├── Started At
├── Finished At
├── Duration
├── Events[]
├── Provider Calls
├── Tool Calls
├── Retry Count
├── Token Usage
├── Error Information
└── Metadata
```

The trace acts as a high-level summary while retaining the full event history.

---

# 10. Responsibility Boundaries

## Execution Components

Responsible for:

- generating events,
- publishing events.

Never responsible for:

- grouping events,
- building traces.

---

## Event Bus

Responsible for:

- delivering events.

Never responsible for:

- storing events,
- ordering traces,
- calculating metadata.

---

## Trace Builder

Responsible for:

- locating traces,
- creating traces,
- appending events,
- maintaining execution timelines,
- updating aggregate metadata.

---

## Trace Repository

Responsible for:

- persisting completed or active traces,
- exposing traces for debugging or analytics.

---

# 11. Failure Scenarios

## Missing Trace

```text
Incoming Event

↓

Unknown Run ID
```

The event should be ignored or stored as an orphan event depending on system policy.

---

## Duplicate Event

```text
tool.completed

↓

tool.completed
```

Duplicate detection should prevent inaccurate metrics where practical.

---

## Out-of-Order Events

Example:

```text
tool.completed

↓

tool.started
```

The Trace Builder should:

- preserve arrival order,
- optionally reorder using timestamps if supported.

---

## Storage Failure

```text
Trace Builder

↓

Persist Trace

↓

Failure
```

Execution should continue.

Observability failures must never interrupt Runtime execution.

---

# 12. Design Principles

## Append-Only Timeline

Events represent historical facts.

They are never modified.

---

## Single Trace Per Run

Every Run owns exactly one execution trace.

---

## Immutable Events

Events remain unchanged after publication.

---

## Separation of Concerns

Execution produces events.

Trace Builder creates execution history.

---

## Passive Observation

The Trace Builder never changes Runtime behavior.

---

# 13. Future Enhancements

## Nested Spans

Support parent-child relationships.

Example:

```text
Provider Call

├── Tool Execution
└── Streaming
```

---

## Distributed Traces

Support traces across multiple services or machines.

---

## OpenTelemetry Export

Export traces to external observability platforms.

---

## Live Trace Streaming

Allow developers to observe active Runs in real time.

---

## Trace Replay

Replay the complete execution timeline for debugging and testing.

---

# Summary

The Trace Creation Flow explains how Agni SDK transforms individual execution events into a complete execution history.

Overall flow:

```text
Execution Components

↓

Events

↓

Event Bus

↓

Trace Builder

↓

Execution Trace

↓

Trace Repository
```

The key architectural principle is:

> Events describe what happened. A trace tells the complete story of how it happened.
