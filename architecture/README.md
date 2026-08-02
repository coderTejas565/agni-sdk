# Agni SDK Architecture Documentation

Welcome to the internal architecture documentation for **Agni SDK**.

This directory contains the complete design of the SDK before implementation. It serves as the single source of truth for architectural decisions, component design, execution flows, and implementation planning.

Unlike the public documentation, which focuses on **how to use the SDK**, this documentation explains **how the SDK is designed and why specific architectural decisions were made**.

---

# Who Is This For?

This documentation is intended for:

- Project maintainers
- Contributors
- Future collaborators
- Anyone interested in understanding the SDK's internal architecture

If you only want to build agents using Agni SDK, refer to the public documentation instead.

---

# Documentation Structure

## 00-overview/

High-level project vision and architecture.

Contents:

- Vision
- Overall Architecture
- Design Philosophy

Read this first.

---

## 01-hld/

High-Level Design (HLD).

Focuses on:

- System boundaries
- Major components
- Responsibilities
- Component interactions

Read this before diving into implementation details.

---

## 02-lld/

Low-Level Design (LLD).

Each major subsystem is documented individually.

Current components include:

- Runtime
- Provider
- Tool Registry
- Memory
- Guardrails
- Observability

Each document explains:

- responsibilities,
- internal architecture,
- interfaces,
- state,
- design principles,
- edge cases.

---

## 03-adr/

Architecture Decision Records.

Each ADR captures an important architectural decision.

Instead of documenting only _what_ was built, ADRs explain:

- why a decision was made,
- alternatives considered,
- trade-offs,
- consequences.

These documents preserve the reasoning behind the architecture.

---

## 04-sequence-diagrams/

Execution flow documentation.

These diagrams illustrate how multiple components collaborate during runtime.

Examples include:

- Runtime execution
- Provider requests
- Tool execution
- Memory retrieval
- Guardrail validation
- Event publishing
- Trace creation

---

## 05-state-machines/

Behavioral models.

These documents describe how each component changes state throughout its lifecycle.

State machines ensure:

- predictable execution,
- valid transitions,
- easier debugging,
- implementation consistency.

---

## 06-api-design/

Public API planning.

This section defines:

- SDK surface area,
- public interfaces,
- configuration objects,
- developer experience.

Implementation begins after this design is finalized.

---

## 07-implementation-plan/

Development roadmap.

Contains implementation milestones, coding standards, and project planning documents.

---

# Recommended Reading Order

For new contributors:

```text
1. 00-overview/
2. 01-hld/
3. 02-lld/
4. 03-adr/
5. 04-sequence-diagrams/
6. 05-state-machines/
7. 06-api-design/
8. Start Implementation
```

Following this order provides the necessary context before working with the source code.

---

# Design Philosophy

Agni SDK follows several architectural principles:

- Separation of Concerns
- Single Responsibility Principle
- Composition over Inheritance
- Event-Driven Observability
- Provider Abstraction
- Loose Coupling
- High Cohesion
- Extensibility by Design

Every major architectural decision should reinforce these principles.

---

# Documentation Guidelines

When introducing a new subsystem:

1. Create an LLD document.
2. Record the architectural decision as an ADR.
3. Add sequence diagrams if execution flow changes.
4. Define a state machine if lifecycle management is involved.
5. Update API design if the public interface changes.

Documentation should evolve alongside the architecture.

---

# Relationship to Public Documentation

This directory documents **how Agni SDK is built**.

The public documentation explains **how Agni SDK is used**.

| Internal Architecture | Public Documentation |
| --------------------- | -------------------- |
| System Design         | Installation         |
| HLD                   | Quick Start          |
| LLD                   | Creating Agents      |
| ADRs                  | Adding Tools         |
| Sequence Diagrams     | Memory Guide         |
| State Machines        | API Reference        |
| API Design            | Examples             |

The two documentation sets serve different audiences and should remain independent.

---

# Guiding Principle

> Build the architecture first. Write the implementation second.

Every implementation decision should be traceable back to the architecture documented in this directory.
