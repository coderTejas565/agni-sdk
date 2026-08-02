# Observability Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Observability System
**Diagram:** Observability Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document defines the lifecycle of the Observability System while processing execution events.

The Observability System continuously listens for events published by the Runtime and other execution components.

For every incoming event, it follows a well-defined sequence of states before returning to an idle state, ready to process the next event.

Unlike the Runtime Lifecycle, which manages an entire agent execution, this lifecycle represents the processing of a **single published event**.

---

# 2. Observability Lifecycle Overview

```text id="q3a7wm"
WAITING

   │

   ▼

EVENT_RECEIVED

   │

   ▼

VALIDATING_EVENT

   │

   ▼

PROCESSING

   │

   ▼

UPDATING_TRACE

   │

   ▼

WRITING_LOG

   │

   ▼

UPDATING_METRICS

   │

   ▼

COMPLETED

   │

   ▼

WAITING


Failure at any stage

        │

        ▼

FAILED
```

The system continuously repeats this cycle for every published event.

---

# 3. State Definitions

The Observability System moves through the following states:

```text id="r1f8ok"
WAITING

EVENT_RECEIVED

VALIDATING_EVENT

PROCESSING

UPDATING_TRACE

WRITING_LOG

UPDATING_METRICS

COMPLETED

FAILED
```

---

# 4. State Descriptions

---

# WAITING

## Meaning

The Observability System is idle.

It is subscribed to the Event Bus and waits for new execution events.

No event is currently being processed.

---

## Allowed Transition

```text id="6b3a2q"
WAITING

↓

EVENT_RECEIVED
```

---

# EVENT_RECEIVED

## Meaning

A new event has been delivered by the Event Bus.

Examples:

- run.started
- provider.completed
- tool.started
- memory.retrieved
- guardrail.blocked

The event is placed into the processing pipeline.

---

## Allowed Transition

```text id="8wr0kn"
EVENT_RECEIVED

↓

VALIDATING_EVENT
```

---

# VALIDATING_EVENT

## Meaning

The incoming event is verified before processing.

Typical validation includes:

- required fields,
- valid Run ID,
- supported event type,
- timestamp format,
- metadata integrity.

Invalid events should never enter the trace.

---

## Possible Outcomes

```text id="v6a9fy"
VALIDATING_EVENT

↓

PROCESSING
```

or

```text id="7gnkzv"
VALIDATING_EVENT

↓

FAILED
```

---

# PROCESSING

## Meaning

The event is interpreted by the Observability System.

Processing includes:

- identifying the correct trace,
- determining affected metrics,
- preparing structured log entries.

No persistent updates occur yet.

---

## Allowed Transition

```text id="3n5uqh"
PROCESSING

↓

UPDATING_TRACE
```

---

# UPDATING_TRACE

## Meaning

The Trace Builder locates the trace associated with the Run ID.

The event is appended to the execution timeline.

Aggregate information may also be updated.

Examples:

- provider count,
- tool count,
- retry count,
- execution duration,
- final status.

---

## Allowed Transition

```text id="kwt4hf"
UPDATING_TRACE

↓

WRITING_LOG
```

---

# WRITING_LOG

## Meaning

A structured log entry is created for the processed event.

Logs are intended for:

- debugging,
- auditing,
- troubleshooting.

Each log should include:

- event name,
- timestamp,
- component,
- Run ID,
- metadata.

---

## Allowed Transition

```text id="zv4pxm"
WRITING_LOG

↓

UPDATING_METRICS
```

---

# UPDATING_METRICS

## Meaning

Performance metrics are updated.

Examples:

- provider latency,
- tool duration,
- event counts,
- token usage,
- total execution time.

Metrics provide operational visibility without modifying execution.

---

## Allowed Transition

```text id="mh0wti"
UPDATING_METRICS

↓

COMPLETED
```

---

# COMPLETED

## Meaning

The event has been fully processed.

The Observability System has:

- updated the trace,
- written logs,
- recorded metrics.

The event lifecycle is complete.

---

## Allowed Transition

```text id="pf4rgo"
COMPLETED

↓

WAITING
```

The system immediately waits for the next event.

---

# FAILED

## Meaning

The event could not be processed.

Possible reasons:

- malformed event,
- unknown event type,
- trace storage failure,
- logger failure,
- unexpected exception.

Failure should never interrupt Runtime execution.

---

# 5. Complete State Machine

```text id="t9w5eg"
                   WAITING
                       │
                       ▼
              EVENT_RECEIVED
                       │
                       ▼
             VALIDATING_EVENT
                       │
                       ▼
                 PROCESSING
                       │
                       ▼
               UPDATING_TRACE
                       │
                       ▼
                WRITING_LOG
                       │
                       ▼
              UPDATING_METRICS
                       │
                       ▼
                  COMPLETED
                       │
                       ▼
                   WAITING

Any state
   │
   ▼
FAILED
```

---

# 6. State Transition Table

| Current State    | Event                 | Next State       |
| ---------------- | --------------------- | ---------------- |
| WAITING          | Event received        | EVENT_RECEIVED   |
| EVENT_RECEIVED   | Begin validation      | VALIDATING_EVENT |
| VALIDATING_EVENT | Validation successful | PROCESSING       |
| VALIDATING_EVENT | Validation failed     | FAILED           |
| PROCESSING       | Event interpreted     | UPDATING_TRACE   |
| UPDATING_TRACE   | Trace updated         | WRITING_LOG      |
| WRITING_LOG      | Log persisted         | UPDATING_METRICS |
| UPDATING_METRICS | Metrics recorded      | COMPLETED        |
| COMPLETED        | Ready for next event  | WAITING          |

---

# 7. Invariants

The following rules must always hold.

---

## Invariant 1

Every event must be validated before processing.

Invalid:

```text id="d0phmz"
EVENT_RECEIVED

↓

UPDATING_TRACE
```

Correct:

```text id="tk6g6m"
EVENT_RECEIVED

↓

VALIDATING_EVENT

↓

PROCESSING
```

---

## Invariant 2

Every processed event belongs to exactly one Run.

Events without a valid Run ID should never update an existing trace.

---

## Invariant 3

Observability never modifies Runtime state.

Its responsibility is observation only.

---

## Invariant 4

Events are immutable.

Once received, they are historical facts.

No component should modify event data.

---

## Invariant 5

Failure inside Observability must never stop agent execution.

Monitoring failures should be isolated from business execution.

---

# 8. Failure Scenarios

## Invalid Event

```text id="tqff5z"
EVENT_RECEIVED

↓

VALIDATING_EVENT

↓

FAILED
```

---

## Trace Repository Failure

```text id="c2bq8x"
UPDATING_TRACE

↓

FAILED
```

---

## Logger Failure

```text id="ndap4v"
WRITING_LOG

↓

FAILED
```

---

## Metrics Failure

```text id="vr7m0g"
UPDATING_METRICS

↓

FAILED
```

---

## Unexpected Exception

Any processing state may transition directly to:

```text id="wnz6fx"
FAILED
```

The Runtime continues unaffected.

---

# 9. Design Principles

## Passive Observation

Observability records execution.

It never controls execution.

---

## Event-Driven Processing

Every lifecycle begins with an event published by another component.

---

## Separation of Concerns

Execution components execute work.

Observability records execution history.

---

## Fault Isolation

Observability failures should remain isolated from Runtime failures.

---

## Continuous Operation

After processing an event, the system immediately returns to the waiting state.

This enables continuous monitoring throughout the lifetime of the SDK.

---

# 10. Future Enhancements

## Parallel Event Processing

Support concurrent processing of independent events.

---

## Event Prioritization

Critical events may be processed before informational events.

---

## Batch Processing

Group multiple events into batches for improved throughput.

---

## Distributed Trace Aggregation

Merge traces generated across multiple nodes or services.

---

## External Exporters

Forward processed events to external observability platforms.

Examples:

- OpenTelemetry
- Datadog
- Grafana
- Jaeger

---

# Summary

The Observability Lifecycle defines how every execution event moves through the monitoring pipeline.

Complete lifecycle:

```text id="u5xjlwm"
Event Published

↓

Event Received

↓

Validated

↓

Processed

↓

Trace Updated

↓

Log Written

↓

Metrics Updated

↓

Completed

↓

Waiting For Next Event
```

The key architectural principle is:

> Observability continuously transforms execution events into traces, logs, and metrics while remaining completely independent of the agent execution itself.
