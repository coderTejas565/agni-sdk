# ADR 002 — Provider Abstraction Layer

**Project:** Agni SDK
**Decision ID:** ADR-002
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

Agni SDK is designed to support AI agents that can work with different Large Language Model providers.

Modern AI applications are not tied to a single model provider.

Developers may want to use:

- OpenAI models,
- Claude models,
- Gemini models,
- future AI providers.

Each provider exposes different:

- APIs,
- request formats,
- response formats,
- streaming mechanisms,
- error structures.

The Runtime should execute agent workflows without knowing which AI provider is being used.

---

# Problem

The Agent Runtime needs a way to communicate with AI models.

The architectural question:

> Should Runtime directly integrate with each AI provider, or should there be an abstraction layer?

---

# Decision

Agni SDK will introduce a **Provider Abstraction Layer**.

The Runtime will communicate only with a common Provider interface.

Provider implementations will act as adapters between Agni SDK and external AI providers.

Architecture:

```text id="n2v6k8"
                         Runtime

                            |

                            v

                  Provider Interface

                            |

        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼

 OpenAI Adapter       Claude Adapter      Gemini Adapter

        |                   |                   |

        ▼                   ▼                   ▼

 OpenAI API          Anthropic API       Google API
```

The Runtime will remain unaware of provider-specific details.

---

# Alternatives Considered

# Alternative 1 — Direct Runtime Integration

## Architecture

```text id="c9p7g0"
Runtime

├── OpenAI SDK

├── Claude SDK

└── Gemini SDK
```

---

## Advantages

- Simple initial implementation.
- Less abstraction.
- Faster prototype development.

---

## Disadvantages

## Tight Coupling

Runtime becomes dependent on external providers.

Example:

```text id="9x8c8q"
Runtime knows:

OpenAI API format

Claude API format

Gemini API format
```

---

## Difficult Provider Addition

Adding a new provider requires Runtime modification.

Example:

```text id="1sq6c4"
Add new model provider

↓

Modify Runtime logic

↓

Risk breaking execution
```

---

## Mixed Responsibilities

Runtime becomes responsible for:

- execution lifecycle,
- provider communication,
- API translation.

This violates separation of concerns.

---

## Decision

Rejected.

---

# Alternative 2 — Provider Abstraction

## Architecture

```text id="6k52bp"
Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External Model API
```

---

## Advantages

## Runtime Independence

Runtime only knows:

```text id="bq7s4f"
Generate response
Stream response
```

It does not know:

```text id="w0h6p1"
Which provider?
Which SDK?
Which API format?
```

---

## Easy Provider Expansion

Adding a new provider becomes:

```text id="v0b1qz"
Create New Adapter

↓

Implement Provider Interface

↓

Register Provider
```

No Runtime changes required.

---

## Better Testing

Provider implementations can be tested independently.

Runtime tests can use mock providers.

Example:

```text id="s1c6j4"
Runtime Test

↓

Mock Provider

↓

Predictable Response
```

---

## Clear Responsibility

Provider owns:

- model communication.

Runtime owns:

- execution orchestration.

---

## Decision

Accepted.

---

# Consequences

# Positive Consequences

---

## Multi-Provider Support

Agni SDK can support multiple AI providers.

Example:

```text id="a6zq21"
OpenAI

Claude

Gemini

Future Models
```

without changing core execution.

---

## Stable Runtime Architecture

Runtime remains focused on agent lifecycle.

It does not grow with every new provider.

---

## Better Maintainability

Provider changes remain isolated.

Example:

If OpenAI changes their API:

```text id="m4f7lq"
Update OpenAI Adapter

↓

No Runtime changes
```

---

## Better Developer Experience

Developers interact with a consistent SDK interface.

They do not need to learn every provider API.

---

# Negative Consequences

---

## Additional Abstraction Layer

The architecture becomes more complex.

Instead of:

```text id="y1u0q3"
Runtime

↓

OpenAI
```

we have:

```text id="u8m0q1"
Runtime

↓

Provider

↓

OpenAI
```

---

## Interface Design Challenge

A poor Provider interface can become restrictive.

Example:

If the interface assumes only text generation, future capabilities become difficult.

Therefore Provider design must support extensibility.

---

# Design Principles Behind This Decision

## Dependency Inversion Principle

High-level modules should not depend on low-level implementations.

Runtime depends on:

```text id="j4k0v2"
Provider Interface
```

not:

```text id="p8l2z7"
OpenAI SDK
```

---

## Adapter Pattern

Each provider translates external APIs into Agni SDK formats.

---

## Open/Closed Principle

New providers can be added without modifying existing core logic.

---

## Separation of Concerns

Each layer owns one responsibility.

```text id="q9r3w8"
Runtime

↓

Execution


Provider

↓

Communication
```

---

# Impact on Future Architecture

This ADR affects multiple components.

---

# Runtime

Runtime will depend on Provider abstraction.

It will never import provider SDKs directly.

---

# Tools

Tools will not know about models.

Tool execution remains independent.

---

# Memory

Memory stores execution context but does not manage provider communication.

---

# Guardrails

Guardrails validate inputs and outputs regardless of provider.

---

# Future Model Routing

Because providers are abstracted, future features become possible:

- automatic provider fallback,
- cost optimization,
- latency optimization,
- model selection.

---

# Architectural Rules

The following rules are established:

## Rule 1

Runtime must never directly call external AI provider APIs.

---

## Rule 2

Every provider must implement the Provider contract.

---

## Rule 3

Provider-specific formats must be converted before reaching Runtime.

---

## Rule 4

Provider must not contain workflow decisions.

---

## Rule 5

Retry and fallback logic belongs outside Provider.

---

# Final Decision Summary

| Decision                                | Result   |
| --------------------------------------- | -------- |
| Runtime directly integrates providers   | Rejected |
| Provider abstraction layer              | Accepted |
| Provider adapters isolate external APIs | Accepted |
| Runtime depends on abstraction          | Accepted |
| Provider owns retry/fallback decisions  | Rejected |
| Internal normalized model format        | Accepted |

---

# Final Statement

The Provider Abstraction Layer creates a stable boundary between Agni SDK's execution engine and rapidly changing AI model providers.

By isolating external AI APIs behind adapters, Agni SDK can evolve with the AI ecosystem while keeping its core Runtime simple, predictable, and maintainable.
