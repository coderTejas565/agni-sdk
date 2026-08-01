# Provider Component — Low-Level Design (LLD)

**Project:** Agni SDK
**Component:** Provider Layer
**Document Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

The Provider Layer is the abstraction boundary between Agni SDK and external Large Language Model providers.

Its responsibility is to provide a unified interface for communicating with different AI model providers while hiding provider-specific implementation details.

The Provider Layer allows Agni SDK to support multiple AI providers such as:

- OpenAI
- Claude
- Gemini
- Future model providers

without changing the Runtime execution engine.

---

The Provider Layer does **not**:

- manage agent execution flow,
- decide when to call models,
- execute tools,
- manage memory,
- handle retry strategies,
- implement business logic.

Its only responsibility is:

> Translate Agni SDK requests into provider-specific requests and return normalized responses.

---

# Part A — Design Discussion

# 2. Intuition

The Provider Layer should be thought of as a **translator**.

Different AI providers speak different languages.

OpenAI has its own API format.

Claude has its own API format.

Gemini has its own API format.

The Runtime should not learn every provider's language.

The Provider Layer acts as the translator between them.

---

# 3. Mental Model

```text
                  Runtime

                     |

                     |

              Provider Interface

                     |

        ┌────────────┼────────────┐

        ▼            ▼            ▼

    OpenAI        Claude       Gemini

        ▼            ▼            ▼

   External APIs
```

The Runtime only understands the Provider interface.

It does not know which model provider is being used.

---

# 4. Design Reasoning

Initially, a simple implementation could directly connect Runtime with one provider.

Example:

```text
Runtime

↓

OpenAI SDK

↓

GPT Model
```

This works for a prototype.

However, as soon as multiple providers are required:

```text
Runtime

↓

OpenAI

Claude

Gemini
```

the Runtime becomes responsible for:

- provider-specific APIs,
- request formats,
- response formats,
- error handling differences.

This creates tight coupling.

The Provider Layer solves this by introducing an abstraction boundary.

---

# 5. Why Provider Exists

Without a Provider Layer:

- Runtime depends on external SDKs.
- Adding new providers requires Runtime changes.
- Provider-specific logic spreads throughout the system.
- Testing becomes harder.

With Provider Layer:

- Runtime depends only on abstractions.
- Providers can be added independently.
- Model switching becomes simple.
- Core execution remains stable.

---

# 6. Trade-offs Considered

## Option 1 — Direct Provider Integration

```text
Runtime

↓

OpenAI SDK
```

### Advantages

- Simple implementation.
- Less initial code.

### Disadvantages

- Tight coupling.
- Difficult multi-provider support.
- Runtime becomes provider-aware.
- Harder testing.

### Decision

Rejected.

---

# Option 2 — Provider Abstraction Layer

```text
Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External Model API
```

### Advantages

- Provider independence.
- Better maintainability.
- Easy model switching.
- Clear ownership boundaries.

### Disadvantages

- Additional abstraction layer.
- More initial design work.

### Decision

Accepted.

---

# 7. Provider as Adapter Layer

Each provider implementation acts as an adapter.

Example:

```text
Agni Request

        |

        v

OpenAI Adapter

        |

        v

OpenAI API


OpenAI Response

        |

        v

Agni Response
```

The adapter converts between:

- Agni internal format.
- Provider-specific format.

---

# Part B — Internal Architecture

The Provider Layer consists of:

```text
                         Provider Layer

                                |

              ┌─────────────────┴─────────────────┐

              ▼                                   ▼

       Provider Interface                 Provider Factory


              |

              |

    ┌─────────┼─────────┐

    ▼         ▼         ▼

 OpenAI    Claude    Gemini

 Adapter   Adapter   Adapter

    |         |         |

    ▼         ▼         ▼

External Provider APIs
```

---

# Part C — Formal LLD

# 8. Responsibilities

The Provider Layer owns:

- Model communication.
- Request transformation.
- Response transformation.
- Provider authentication handling.
- Streaming communication.
- Provider-specific error translation.

---

The Provider Layer does not own:

- Agent loops.
- Tool execution.
- Memory management.
- Retry decisions.
- Fallback strategies.
- Application logic.

---

# 9. Provider Interface Concept

The Runtime communicates with a common Provider abstraction.

Conceptually:

```text
Provider

|

├── Generate Response

└── Stream Response
```

The interface hides provider differences.

---

# 10. Provider Capabilities

The initial Provider design focuses on agent execution requirements.

## V1 Capabilities

```text
Provider

├── Text Generation

└── Streaming
```

---

## Future Capabilities

Possible extensions:

```text
Provider Capabilities

├── Embeddings

├── Vision

├── Audio

├── Token Counting

└── Structured Output
```

Capabilities should be added independently rather than forcing every provider to implement everything.

---

# 11. Normalized Data Model

Agni SDK uses an internal normalized format.

The Runtime works with Agni formats only.

Example:

```text
Agni Request

        |

        v

Provider Adapter

        |

        v

Provider Request


Provider Response

        |

        v

Provider Adapter

        |

        v

Agni Response
```

---

A normalized response may contain:

- generated content,
- tool calls,
- finish reason,
- token usage,
- metadata.

---

# 12. Provider Creation

The public developer experience uses a provider factory.

Conceptually:

```text
Developer

↓

createProvider()

↓

Provider Instance
```

The internal implementation uses provider adapters.

Example architecture:

```text
Factory

↓

OpenAIProvider

ClaudeProvider

GeminiProvider
```

---

# 13. Error Handling Responsibility

Provider reports provider-specific failures.

Examples:

- authentication failure,
- timeout,
- rate limit,
- unavailable service.

The Provider converts them into Agni SDK errors.

Example:

```text
OpenAI Timeout Error

↓

Provider Error

↓

Runtime Failure Manager
```

---

# 14. Retry and Fallback Responsibility

Retry and fallback are intentionally outside Provider.

Reason:

Retry is a workflow decision.

Example:

```text
Provider Failure

↓

Failure Manager

↓

Decision:

Retry?

Fallback?

Stop?
```

The Provider only reports what happened.

---

# 15. Provider Sequence Flow

```text
Runtime

↓

Provider Interface

↓

Selected Provider Adapter

↓

External Model API

↓

Provider Adapter

↓

Normalized Response

↓

Runtime
```

---

# 16. Component Diagram

```text
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

---

# 17. Design Principles

## Abstraction Over Implementation

Runtime depends on contracts, not vendors.

---

## Adapter Pattern

Provider implementations translate external APIs into internal formats.

---

## Dependency Inversion

Core execution depends on Provider abstraction.

---

## Open/Closed Principle

New providers can be added without modifying Runtime.

---

## Capability-Based Design

Providers expose supported capabilities without forcing unnecessary implementations.

---

## Loose Coupling

External AI providers remain isolated from the core system.

---

# 18. Edge Cases

The Provider Layer must handle:

- Provider authentication failure.
- Invalid API responses.
- Provider timeout.
- Rate limiting.
- Network failures.
- Unsupported model features.
- Streaming interruption.
- Malformed provider responses.
- Provider API changes.

---

# 19. Future Extensions

Possible future Provider capabilities:

- Automatic model routing.
- Cost-aware model selection.
- Latency optimization.
- Provider health monitoring.
- Multi-provider parallel execution.
- Model benchmarking.

---

# 20. Architectural Decisions

| Decision                    | Reason                                                       |
| --------------------------- | ------------------------------------------------------------ |
| Provider abstraction layer  | Prevents Runtime coupling with AI vendors.                   |
| Provider adapters           | Isolates provider-specific implementations.                  |
| Normalized internal format  | Keeps Runtime provider-independent.                          |
| Retry outside Provider      | Retry is execution policy, not communication responsibility. |
| Factory-based creation      | Provides better developer experience.                        |
| Capability-based interfaces | Prevents forcing unsupported features.                       |

---

# Summary

The Provider Layer is the communication boundary between Agni SDK and external AI models.

It does not control agent behavior.

It does not execute workflows.

It simply provides a consistent interface for interacting with different AI providers.

By separating model communication from execution orchestration, Agni SDK remains provider-independent, extensible, and ready to support future AI models.
