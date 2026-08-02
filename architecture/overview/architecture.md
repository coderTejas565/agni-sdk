# Agni SDK — Architecture Overview

## 1. System Overview

Agni SDK is an orchestration framework that coordinates multiple components required for AI agent execution.

The SDK does not generate intelligence itself.

Instead, it manages the lifecycle around intelligence generation.

---

# 2. High-Level Architecture

```text
                    Developer

                         |

                         v

                 Agent Configuration

                         |

                         v

                    Agent

                         |

                         v

              +----------------+
              | Runtime Engine |
              +----------------+

              /       |        \

             /        |         \

            v         v          v

       Provider     Tools     Memory


             |

             v

          LLM Models
```

---

# 3. Core Components

## Agent

Represents the configuration of an AI agent.

Owns:

- instructions,
- model configuration,
- available capabilities.

The Agent does not execute tasks.

---

## Runtime

The central execution orchestrator.

Responsible for:

- managing runs,
- controlling execution flow,
- coordinating components.

---

## Provider

Abstract layer between Agni SDK and AI models.

Supports multiple providers:

- OpenAI,
- Claude,
- Gemini,
- future models.

---

## Tool System

Provides external capabilities to agents.

Examples:

- APIs,
- databases,
- calculations,
- business services.

---

## Memory

Manages conversational and persistent state.

---

## Guardrails

Provides safety and validation.

Examples:

- input validation,
- output validation,
- tool restrictions.

---

## Observability

Provides:

- events,
- traces,
- debugging information.

---

# 4. Execution Philosophy

A user request creates a Run.

A Run represents one complete agent execution lifecycle.

```text
User Input

↓

Run Created

↓

Runtime Execution

↓

Model Interaction

↓

Tool Usage

↓

Context Update

↓

Final Response

↓

Run Completed
```

---

# 5. Architectural Principles

The architecture follows:

- modular design,
- separation of responsibility,
- loose coupling,
- extensibility,
- explicit ownership.
