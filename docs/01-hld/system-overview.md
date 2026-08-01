# Agni SDK — High-Level Design

## 1. Purpose

This document describes the high-level architecture of Agni SDK.

It defines:

- system boundaries,
- actors,
- responsibilities,
- major components,
- component relationships.

Implementation details are intentionally excluded.

---

# 2. System Boundary

Agni SDK exists between application developers and external AI infrastructure.

```text
External World

Developer
User
LLM Providers
External APIs
Databases


          |

          v


+---------------------------+
|                           |
|        Agni SDK           |
|                           |
+---------------------------+


          |

          v


External Services
```

---

# 3. System Actors

## Developer

Creates and configures agents.

---

## User

Provides requests to the agent.

---

## Agent

Represents AI behavior configuration.

---

## Runtime

Coordinates execution.

---

## LLM Provider

Provides reasoning capabilities.

---

## Tools

Execute external operations.

---

## Memory

Stores context and history.

---

# 4. Component Responsibilities

| Component     | Responsibility            |
| ------------- | ------------------------- |
| Agent         | Defines behavior          |
| Runtime       | Executes workflows        |
| Provider      | Communicates with models  |
| Tools         | Performs external actions |
| Memory        | Stores state              |
| Guardrails    | Controls safety           |
| Observability | Tracks execution          |

---

# 5. Core Execution Flow

```text
User Request

↓

Runtime Creates Run

↓

Load Context

↓

Call Model

↓

Model Decision

↓

Execute Tool if Required

↓

Update Context

↓

Continue Until Complete

↓

Return Result
```

---

# 6. Architectural Decision

The system follows a runtime-centric architecture.

The Runtime owns execution coordination.

Other components provide specialized capabilities.

This prevents tight coupling and allows independent evolution of each subsystem.
