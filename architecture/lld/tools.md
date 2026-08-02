# Tool System — Low-Level Design (LLD)

**Project:** Agni SDK
**Component:** Tool System
**Document Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

The Tool System provides external capabilities to AI agents.

Large Language Models are powerful reasoning engines, but they cannot directly:

- access external systems,
- query databases,
- call APIs,
- execute actions,
- interact with real-world resources.

The Tool System bridges this gap by allowing developers to expose controlled capabilities that agents can use during execution.

---

The Tool System is responsible for:

- registering tools,
- discovering available tools,
- validating tool inputs,
- executing tools,
- handling tool results,
- managing tool failures.

The Tool System does **not** decide when a tool should be used.

The LLM decides tool selection.

The Runtime coordinates execution.

---

# Part A — Design Discussion

# 2. Intuition

A tool should be thought of as a **capability provided to an agent**.

A tool is not just a function.

It is a complete capability containing:

```text
Tool

├── Identity

├── Contract

├── Validation

└── Execution
```

Example:

A weather capability:

```text
Name:

get_weather


Contract:

Input:
city:string


Execution:

Call weather API
```

---

# 3. Mental Model

The Tool System works like a plugin architecture.

The Runtime does not know every possible capability.

It only knows:

> "I need a tool with this name."

The Tool System finds and executes it.

```text
                         Runtime

                            |

                            v

                     Tool Manager

                            |

                            v

                    Tool Registry

                            |

              ┌─────────────┼─────────────┐

              ▼             ▼             ▼

        Weather Tool   Search Tool   Database Tool
```

---

# 4. Why Tools Exist

Without tools:

```text
User

↓

LLM

↓

Text Response
```

The model is limited to its training knowledge.

---

With tools:

```text
User

↓

LLM

↓

Tool Decision

↓

Tool Execution

↓

External System

↓

Result

↓

LLM

↓

Final Answer
```

The agent can now interact with external systems.

---

# 5. Design Reasoning

The Agent Runtime already coordinates the execution lifecycle.

The Provider communicates with models.

Tools provide capabilities.

Each component has a different responsibility.

If tools were placed directly inside Runtime:

```text
Runtime

├── Agent Loop

├── Provider

├── Tools

├── Memory

└── Errors
```

Runtime would become a God Object.

Therefore, tools require their own subsystem.

---

# 6. Trade-offs Considered

# Option 1 — Tools Inside Runtime

Architecture:

```text
Runtime

↓

Tools
```

---

Advantages:

- Simple initially.
- Less abstraction.

---

Disadvantages:

- Runtime becomes tightly coupled.
- Adding tools requires Runtime changes.
- Harder testing.
- Violates separation of concerns.

---

Decision:

Rejected.

---

# Option 2 — Separate Tool System

Architecture:

```text
Runtime

↓

Tool Manager

↓

Tools
```

---

Advantages:

- Independent subsystem.
- Easier extension.
- Better testing.
- Clear ownership.

---

Disadvantages:

- Additional abstraction.

---

Decision:

Accepted.

---

# 7. Tool Selection vs Tool Execution

A critical design decision:

Who decides which tool runs?

---

The LLM decides.

Example:

User:

"Find weather in Mumbai."

Available tools:

```text
weather_tool

search_tool

database_tool
```

The model decides:

```text
Use weather_tool
```

---

The Runtime executes.

Flow:

```text
LLM

↓

Tool Call

↓

Runtime

↓

Tool Registry

↓

Tool Execution
```

---

# 8. Tool Result Flow

Tool results do not directly go to the model.

The Runtime remains the control point.

Flow:

```text
Tool

↓

Runtime

↓

Validation / Processing

↓

Provider

↓

LLM
```

This allows:

- tracing,
- filtering,
- policy checks,
- error handling.

---

# Part B — Internal Architecture

# 9. Tool System Architecture

```text
                         Tool System


                            |

                            |

                     Tool Manager


                            |

              ┌─────────────┴─────────────┐

              ▼                           ▼

        Tool Registry              Tool Executor


              |

              |

        Registered Tools


              |

     ┌────────┼────────┐

     ▼        ▼        ▼

 Weather   Search   Database


              |

              v

       External Systems
```

---

# 10. Internal Components

## Tool Manager

Responsible for coordinating tool operations.

Responsibilities:

- receive execution requests,
- communicate with registry,
- invoke executor.

---

## Tool Registry

Maintains available tools.

Responsibilities:

- register tools,
- remove tools,
- find tools by name,
- provide tool metadata.

---

## Tool Executor

Responsible for running tool logic.

Responsibilities:

- validate input,
- execute function,
- capture result,
- handle execution errors.

---

# Part C — Formal LLD

# 11. Responsibilities

The Tool System owns:

## Tool Registration

Developers can add custom tools.

---

## Tool Discovery

Find tools requested by the Runtime.

---

## Input Validation

Ensure tool arguments match the defined contract.

---

## Tool Execution

Run the tool implementation.

---

## Result Handling

Return successful results or structured errors.

---

## Error Translation

Convert raw failures into Agni-compatible errors.

---

# 12. Responsibilities Not Owned

The Tool System does not own:

- deciding tool usage,
- agent reasoning,
- model communication,
- memory storage,
- retry policy,
- workflow control.

---

# 13. Tool State

The Tool System maintains:

## Registry State

Contains:

```text
Registered Tools

Tool Metadata

Tool Schemas

Tool Permissions
```

---

## Execution State

Contains:

```text
Execution ID

Current Tool

Input Arguments

Execution Status

Result

Error Information
```

---

# 14. Tool Lifecycle

A tool execution follows:

```text
REQUESTED

↓

VALIDATING_INPUT

↓

EXECUTING

↓

PROCESSING_RESULT

↓

COMPLETED
```

Failure:

```text
ANY STATE

↓

FAILED
```

---

# 15. Tool Interface Concept

A Tool contains:

```text
Tool

├── Name

├── Description

├── Input Schema

├── Execute Function

└── Result Handler
```

---

The contract provides the model with:

- available capability,
- purpose,
- required arguments.

---

# 16. Tool Availability Model

Tools are globally registered but agent-scoped.

Architecture:

```text
Global Tool Registry


        |

        |

Agent Configuration


        |

        |

Available Tools
```

---

Example:

Global:

```text
weather_tool

database_tool

email_tool
```

Agent A:

```text
weather_tool
```

Agent B:

```text
database_tool
```

---

# 17. Tool Execution Sequence

```text
LLM

↓

Tool Call

↓

Runtime

↓

Tool Manager

↓

Tool Registry

↓

Tool Executor

↓

Tool Implementation

↓

External System

↓

Result

↓

Runtime

↓

LLM
```

---

# 18. Tool Failure Handling

Tool failures are classified.

---

## Recoverable Failure

Example:

```text
API timeout
```

Flow:

```text
Tool Failure

↓

Runtime

↓

LLM receives failure

↓

Agent decides next step
```

---

## Fatal Failure

Example:

```text
Security violation
System corruption
```

Flow:

```text
Tool Failure

↓

Runtime

↓

Execution stopped
```

---

# 19. Component Diagram

```text
                         Runtime

                            |

                            v

                     Tool Manager

                            |

              ┌─────────────┴─────────────┐

              ▼                           ▼

        Tool Registry              Tool Executor


              |

              |

        Tool Instances


              |

     ┌────────┼────────┐

     ▼        ▼        ▼

 Weather   Search   Database
```

---

# 20. Design Principles

## Separation of Concerns

Tools own capabilities.

Runtime owns orchestration.

---

## Plugin Architecture

New tools can be added without modifying Runtime.

---

## Contract-Based Design

Every tool exposes:

- identity,
- schema,
- behavior.

---

## Controlled Execution

Tools run through the Runtime instead of directly interacting with models.

---

## Extensibility

Developers can create custom tools.

---

## Safety First

Tool execution is controlled and observable.

---

# 21. Edge Cases

The Tool System should handle:

- tool not found,
- invalid input arguments,
- schema validation failure,
- execution timeout,
- external API failure,
- tool returning invalid data,
- duplicate tool registration,
- unauthorized tool access,
- infinite tool execution,
- malicious tool output.

---

# 22. Future Extensions

Possible future capabilities:

## Human Approval

For sensitive actions:

```text
Tool Call

↓

Approval Required

↓

Execute
```

---

## Tool Permissions

Control which agents can access tools.

---

## Tool Cost Tracking

Measure expensive operations.

---

## Tool Sandboxing

Run unsafe tools in isolated environments.

---

## Tool Versioning

Support multiple versions of tools.

---

# 23. Architectural Decisions

| Decision                          | Reason                                  |
| --------------------------------- | --------------------------------------- |
| Separate Tool System              | Prevents Runtime becoming a God Object. |
| LLM selects tools                 | Tool selection requires reasoning.      |
| Runtime executes tools            | Maintains execution control.            |
| Agent-scoped tools                | Improves security and flexibility.      |
| Registry separated from Runtime   | Keeps responsibilities isolated.        |
| Tool results pass through Runtime | Enables validation and tracing.         |
| Human approval deferred           | Belongs to guardrails layer.            |

---

# Summary

The Tool System gives AI agents the ability to interact with external systems.

The architecture separates:

```text
LLM

↓

Decision


Runtime

↓

Coordination


Tool System

↓

Capability Execution
```

A tool is not simply a function.

It is a controlled capability with:

- a contract,
- validation,
- execution,
- lifecycle management.

By isolating tools from Runtime, Agni SDK remains modular, extensible, and ready to support complex agent capabilities.
