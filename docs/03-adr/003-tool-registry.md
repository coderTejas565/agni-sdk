# ADR 003 — Tool Registry Architecture

**Project:** Agni SDK
**Decision ID:** ADR-003
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

AI agents need the ability to use external capabilities such as:

- searching information,
- accessing databases,
- calling APIs,
- executing actions.

In Agni SDK, these capabilities are represented as Tools.

As the SDK grows, agents may have access to many different tools.

Examples:

```text
weather_tool

search_tool

database_tool

email_tool

calendar_tool
```

The architecture needs a mechanism to:

- store available tools,
- discover tools,
- manage tool metadata,
- provide tools during agent execution.

The architectural question:

> How should Agni SDK manage and access tools?

---

# Problem

A naive implementation could store tools directly inside Runtime.

Example:

```text
Runtime

├── Agent Loop

├── Provider

├── Weather Tool

├── Search Tool

└── Database Tool
```

This creates several problems:

- Runtime becomes responsible for too many concerns.
- Adding new tools requires modifying Runtime.
- Tool discovery logic spreads across the system.
- Testing becomes difficult.

A separate tool management mechanism is required.

---

# Decision

Agni SDK will introduce a dedicated **Tool Registry**.

The Tool Registry will maintain available tools and provide discovery capabilities.

Architecture:

```text
                         Runtime

                            |

                            v

                     Tool Manager

                            |

                            v

                     Tool Registry

                            |

        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼

 Weather Tool        Search Tool        Database Tool
```

The Runtime will not directly store or manage tools.

---

# Alternatives Considered

# Alternative 1 — Tools Stored Inside Runtime

## Architecture

```text
Runtime

├── Execution Engine

├── Provider

├── Tool A

├── Tool B

└── Tool C
```

---

## Advantages

- Simple implementation.
- Fewer components.
- Easy for small prototypes.

---

## Disadvantages

## Runtime Becomes a God Object

Runtime starts managing:

- execution,
- providers,
- tools,
- validation,
- registration.

This violates separation of concerns.

---

## Poor Extensibility

Adding a tool requires Runtime modification.

Example:

```text
Add Calendar Tool

↓

Modify Runtime

↓

Risk breaking execution
```

---

## Difficult Testing

Runtime tests require loading every tool.

---

## Decision

Rejected.

---

# Alternative 2 — Global Tool Registry

## Architecture

```text
Application

↓

Tool Registry

↓

All Tools
```

---

## Advantages

- Simple discovery.
- Centralized storage.
- Easy registration.

---

## Problems

All tools become available everywhere.

Example:

```text
Customer Agent

can see:

delete_database_tool
```

This creates:

- security concerns,
- unnecessary context,
- poor agent isolation.

---

## Decision

Partially accepted internally.

A global registry can exist, but agents must receive scoped tools.

---

# Alternative 3 — Registry + Agent Tool Scope

## Architecture

```text
Global Tool Registry

          |

          |

Agent Configuration

          |

          |

Available Agent Tools
```

---

## Advantages

## Better Isolation

Each agent receives only required tools.

Example:

Customer Agent:

```text
search_customer

create_ticket
```

Research Agent:

```text
web_search

summarize
```

---

## Better Security

Sensitive tools are not exposed to unrelated agents.

---

## Better Context Management

The LLM only sees relevant tools.

---

## Decision

Accepted.

---

# Consequences

# Positive Consequences

---

## Separation of Concerns

Runtime focuses on execution.

Tool Registry focuses on tool management.

---

## Dynamic Tool Registration

Developers can add tools without modifying Runtime.

Example:

```text
Register New Tool

↓

Registry Stores Tool

↓

Agent Can Use Tool
```

---

## Better Agent Isolation

Different agents can have different capabilities.

---

## Easier Testing

Tool Registry can be tested independently.

Runtime can use mock registries.

---

## Future Extensibility

The architecture supports future features:

- tool permissions,
- tool versioning,
- tool marketplace,
- dynamic loading.

---

# Negative Consequences

---

## Additional Component

The architecture becomes more complex.

Instead of:

```text
Runtime → Tool
```

we have:

```text
Runtime

↓

Tool Manager

↓

Tool Registry

↓

Tool
```

---

## Registry Management Required

The system must handle:

- duplicate tools,
- missing tools,
- lifecycle management.

---

# Design Principles Behind This Decision

---

# Single Responsibility Principle

Runtime:

```text
Execute Agent
```

Tool Registry:

```text
Manage Tools
```

---

# Open/Closed Principle

New tools can be added without modifying existing components.

---

# Dependency Inversion

Runtime depends on tool abstractions, not concrete tools.

---

# Plugin Architecture

Tools behave like external plugins.

---

# Agent Capability Isolation

Agents receive only required capabilities.

---

# Impact on System Architecture

---

# Runtime

Runtime communicates with Tool Manager.

It does not directly access tools.

Flow:

```text
Runtime

↓

Tool Manager

↓

Tool Registry

↓

Tool
```

---

# Agent Configuration

Agents define available tools.

Example:

```text
Agent

├── Instructions

├── Model

└── Tools
```

---

# Provider

Provider only communicates with the model.

It does not know tools exist.

---

# Guardrails

Future guardrail layer can use the registry for:

- permissions,
- approval checks,
- safety policies.

---

# Architectural Rules

## Rule 1

Runtime must never maintain its own tool collection.

---

## Rule 2

All tools must be registered through Tool Registry.

---

## Rule 3

Agents receive scoped tools, not the entire registry.

---

## Rule 4

Tool Registry manages discovery only.

It does not execute business logic.

---

## Rule 5

Tool execution happens through Tool Executor.

---

# Final Decision Summary

| Decision                           | Result   |
| ---------------------------------- | -------- |
| Store tools inside Runtime         | Rejected |
| Dedicated Tool Registry            | Accepted |
| Global registry only               | Rejected |
| Global registry + agent scopes     | Accepted |
| Runtime directly executes tools    | Rejected |
| Tool Manager coordinates execution | Accepted |

---

# Final Statement

The Tool Registry creates a clean capability management layer inside Agni SDK.

By separating tool storage and discovery from Runtime execution, the SDK avoids becoming tightly coupled while enabling scalable agent capabilities.

The registry design allows Agni SDK to evolve from simple tools into a complete extensible agent capability ecosystem.
