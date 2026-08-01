# Memory Component — Low-Level Design (LLD)

**Project:** Agni SDK
**Component:** Memory System
**Document Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

The Memory System provides persistence and context management capabilities for AI agents.

Large Language Models are naturally stateless.

Each model interaction only understands the information provided in the current request.

The Memory System gives agents the ability to:

- remember previous conversations,
- maintain current task context,
- recall important user information,
- retrieve relevant historical knowledge.

---

The Memory System exists because an intelligent agent requires more than reasoning.

An agent needs:

```text
Reasoning

+

Experience

+

Context
```

The LLM provides reasoning.

Memory provides experience and context.

---

# Part A — Design Discussion

# 2. Intuition

Memory should be thought of as an agent's external brain.

The LLM is not the memory.

The LLM is the reasoning engine.

Memory stores information that can be provided back to the model when required.

Human analogy:

```text
Human Brain

├── Working Memory
│
├── Short-Term Memory
│
└── Long-Term Memory
```

Agent memory follows the same idea.

---

# 3. Mental Model

The Memory System is a knowledge management layer.

```text
                    Agent

                      |

                      v

               Memory Manager

                      |

       ┌──────────────┼──────────────┐

       ▼              ▼              ▼

 Conversation      Session       Long-Term

 Memory            Memory        Memory

                      |

                      v

              Storage Infrastructure
```

---

# 4. Why Memory Exists

Without memory:

```text
User

↓

Prompt

↓

LLM

↓

Response

↓

Forget Everything
```

---

With memory:

```text
User

↓

Agent

↓

Memory Retrieval

↓

Context Building

↓

LLM

↓

Response

↓

Memory Update
```

---

# 5. Important Distinction

Memory is not conversation history.

Conversation history:

```text
User:
Hello

Assistant:
Hi
```

Memory:

```text
User prefers TypeScript.

User works on backend systems.

User previously built an LMS.
```

Memory extracts useful knowledge.

It does not blindly store everything.

---

# 6. Memory Types

Agni SDK separates memory into three categories.

---

# Conversation Memory

Purpose:

Maintain current conversation context.

Example:

```text
User:
Create authentication system.

Assistant:
Use JWT.

User:
Continue.
```

Used during:

- current chat,
- active conversation.

---

# Session Memory

Purpose:

Maintain temporary agent state.

Example:

```text
Task:

Build LMS module


Progress:

Batch module completed.

Student module pending.
```

Lifetime:

Current working session.

---

# Long-Term Memory

Purpose:

Store persistent knowledge.

Examples:

```text
User prefers TypeScript.

User likes detailed explanations.

User works on backend projects.
```

Long-term memory uses:

- structured storage,
- semantic retrieval,
- embeddings.

---

# 7. Design Reasoning

Memory has different responsibilities:

- storing information,
- retrieving information,
- preparing context,
- extracting useful knowledge.

A single storage layer would mix these concerns.

Therefore:

A Memory Manager coordinates specialized memory types.

---

# 8. Trade-offs Considered

# Option 1 — Runtime Owns Memory Logic

Architecture:

```text
Runtime

├── Execution

├── Provider

├── Tools

└── Memory
```

---

## Advantages

Simple initially.

---

## Problems

Runtime becomes responsible for:

- execution,
- storage,
- retrieval,
- context management.

This violates separation of concerns.

---

Decision:

Rejected.

---

# Option 2 — Separate Memory System

Architecture:

```text
Runtime

↓

Memory Manager

↓

Memory Storage
```

---

## Advantages

- Independent subsystem.
- Easier testing.
- Replaceable storage.
- Better scalability.

---

Decision:

Accepted.

---

# 9. Memory Creation Strategy

A major decision:

What should become memory?

---

## Store Everything

Rejected.

Problem:

Memory pollution.

Example:

```text
Hello

Thanks

Okay
```

These provide no long-term value.

---

## LLM-Based Memory Extraction

Accepted.

Flow:

```text
Conversation

↓

LLM Extraction

↓

Important Information

↓

Memory Store
```

Example:

Conversation:

```text
I prefer TypeScript.
```

Extracted:

```text
Preference:

User prefers TypeScript.
```

---

# 10. Storage Strategy

Memory uses an abstraction layer.

Architecture:

```text
Memory Manager

↓

Storage Adapter

↓

Implementation
```

Possible implementations:

```text
PostgreSQL

Redis

SQLite

Vector Database
```

---

# Part B — Internal Architecture

# 11. Memory Architecture

```text
                         Runtime

                            |

                            v


                    Memory Manager


                            |

        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼


 Conversation          Session            Long-Term

 Memory                Memory            Memory


        |                   |                   |

        └───────────────────┼───────────────────┘

                            |

                            v


                    Storage Adapter


                            |

        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼


    Database             Cache          Vector Store
```

---

# 12. Internal Components

## Memory Manager

Central coordinator.

Responsibilities:

- retrieve memory,
- store memory,
- coordinate memory types,
- prepare context.

---

## Conversation Memory

Responsible for:

- current messages,
- conversation history,
- context window management.

---

## Session Memory

Responsible for:

- current agent state,
- temporary information,
- active task progress.

---

## Long-Term Memory

Responsible for:

- persistent knowledge,
- semantic retrieval,
- important user information.

---

## Storage Adapter

Responsible for:

- abstracting storage implementation,
- allowing different databases.

---

# Part C — Formal LLD

# 13. Responsibilities

The Memory System owns:

## Memory Storage

Persist useful information.

---

## Memory Retrieval

Find relevant information.

---

## Context Preparation

Prepare memory before LLM execution.

---

## Memory Extraction

Identify important information from interactions.

---

## Persistence Management

Maintain memories across sessions.

---

# 14. Responsibilities Not Owned

Memory does not own:

- agent execution,
- model reasoning,
- tool selection,
- response generation,
- workflow decisions.

---

# 15. Memory State

Memory maintains:

## Conversation State

Contains:

```text
Conversation ID

Messages

Timestamp

Context Size
```

---

## Session State

Contains:

```text
Session ID

Current Task

Temporary Context

Execution Progress
```

---

## Long-Term Memory State

Contains:

```text
Memory ID

Content

Embedding

Metadata

Created Time

Importance
```

---

# 16. Memory Retrieval Flow

Example:

User:

```text
Build something similar to my previous project.
```

Flow:

```text
Runtime

↓

Memory Manager

↓

Search Relevant Memories

↓

Context Builder

↓

Provider

↓

LLM
```

---

# 17. Memory Storage Flow

After execution:

```text
Conversation

↓

Memory Extractor

↓

Important Information

↓

Memory Manager

↓

Storage Adapter

↓

Database
```

---

# 18. Sequence Diagram

```text
                 Runtime

                    |

                    v

              Memory Manager

                    |

        ┌───────────┴───────────┐

        ▼                       ▼

 Retrieval                 Storage


        |                       |

        ▼                       ▼


 Memory Store            Storage Adapter


        |                       |

        ▼                       ▼


 Context Builder         Database / Vector DB


                    |

                    v

                   LLM
```

---

# 19. Memory Lifecycle

```text
CREATED

↓

EXTRACTED

↓

VALIDATED

↓

STORED

↓

AVAILABLE

↓

RETRIEVED

↓

USED

↓

UPDATED

or

DELETED
```

---

# 20. Hybrid Retrieval Strategy

Long-term memory supports two retrieval approaches.

---

## Structured Retrieval

Used for exact information.

Examples:

- user ID,
- preferences,
- metadata.

Storage:

```text
Database Query
```

---

## Semantic Retrieval

Used for meaning-based search.

Example:

Stored:

```text
User likes backend development.
```

Query:

```text
Suggest technologies.
```

Uses:

```text
Embedding

↓

Vector Search
```

---

# 21. Component Diagram

```text
                         Memory System


                              |

                              v


                       Memory Manager


          ┌───────────────────┼───────────────────┐


          ▼                   ▼                   ▼


 Conversation            Session            Long-Term

 Storage                 Storage            Storage


          |                   |                   |


          └───────────────────┼───────────────────┘


                              |

                              v


                      Storage Adapter


                              |

          ┌───────────────────┼───────────────────┐


          ▼                   ▼                   ▼


      PostgreSQL          Redis            Vector DB
```

---

# 22. Design Principles

## Separation of Concerns

Memory manages knowledge.

Runtime manages execution.

---

## Storage Independence

Storage implementation can change without changing memory logic.

---

## Relevant Retrieval

Only useful information should reach the model.

---

## Context Efficiency

Memory should reduce unnecessary context size.

---

## Extensibility

New memory types can be added later.

---

## Privacy Awareness

Sensitive information should not be stored without control.

---

# 23. Edge Cases

The Memory System should handle:

- empty memory results,
- storage unavailable,
- duplicate memories,
- conflicting memories,
- outdated information,
- context overflow,
- vector search failure,
- invalid memory extraction,
- excessive memory growth,
- sensitive information leakage.

---

# 24. Future Extensions

Possible future capabilities:

## Memory Importance Scoring

Rank memories by value.

---

## Memory Expiration

Automatically remove outdated information.

---

## Memory Guardrails

Prevent storing sensitive data.

---

## Memory Compression

Reduce storage size.

---

## User-Controlled Memory

Allow users to view and delete memories.

---

# 25. Architectural Decisions

| Decision                              | Reason                                         |
| ------------------------------------- | ---------------------------------------------- |
| Separate Memory System                | Prevent Runtime from becoming a God Object.    |
| Multiple memory types                 | Different information has different lifetimes. |
| Storage Adapter Pattern               | Allows database flexibility.                   |
| Hybrid retrieval                      | Supports both exact and semantic search.       |
| LLM memory extraction                 | Prevents storing unnecessary information.      |
| Runtime coordinates memory            | Maintains execution ownership.                 |
| Long-term memory uses semantic search | Enables meaning-based recall.                  |

---

# Summary

The Memory System gives Agni SDK the ability to maintain context and learn from previous interactions.

The architecture separates:

```text
LLM

↓

Reasoning


Runtime

↓

Coordination


Memory System

↓

Knowledge Management
```

Memory is not intelligence.

Memory is the information layer that allows intelligence to become consistent over time.

By separating conversation, session, and long-term memory, Agni SDK can support simple conversations as well as advanced autonomous agents.
