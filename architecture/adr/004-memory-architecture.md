# ADR 004 — Memory Architecture

**Project:** Agni SDK
**Decision ID:** ADR-004
**Status:** Accepted
**Date:** Pre-Implementation Phase

---

# Context

AI agents require the ability to maintain context across interactions.

A raw LLM call is stateless:

```text
User Input

↓

LLM

↓

Response

↓

Context Lost
```

For an agent to behave consistently, it needs the ability to:

- remember previous conversations,
- maintain current task information,
- recall important historical knowledge.

Therefore, Agni SDK requires a dedicated Memory System.

---

# Problem

The main architectural questions:

1. Where should memory responsibility exist?
2. How should different types of memory be managed?
3. How should memory storage be implemented?
4. How should relevant memories be retrieved?
5. Who decides what information should be remembered?

---

# Decision Summary

Agni SDK will use:

- a separate Memory System,
- multiple specialized memory types,
- storage abstraction through adapters,
- hybrid retrieval,
- LLM-assisted memory extraction.

Architecture:

```text
                         Runtime

                            |

                            v


                    Memory Manager


        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼


 Conversation          Session            Long-Term

 Memory                Memory            Memory


                            |

                            v


                    Storage Adapter


        ┌───────────────────┼───────────────────┐

        ▼                   ▼                   ▼


    Database             Cache          Vector Store
```

---

# Decision 1 — Memory Must Be Separate From Runtime

## Context

Runtime is responsible for agent execution.

Memory is responsible for knowledge management.

The question:

Should Runtime directly manage memory?

---

# Option 1 — Runtime Owns Memory

Architecture:

```text
Runtime

├── Agent Loop

├── Provider

├── Tools

└── Memory Logic
```

---

## Advantages

- Simple implementation.
- Fewer components.

---

## Problems

Runtime becomes responsible for:

- execution,
- retrieval,
- storage,
- context management.

The Runtime becomes a God Object.

Example:

```text
Runtime

knows:

how agents run

+
how tools work

+
how memory works

+
how storage works
```

---

## Decision

Rejected.

---

# Option 2 — Dedicated Memory System

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

- Clear ownership.
- Independent evolution.
- Easier testing.
- Better separation.

---

## Decision

Accepted.

---

# Consequence

Runtime only coordinates:

```text
"Give me relevant context"
```

Memory decides:

```text
"How to retrieve and store it"
```

---

# Decision 2 — Multiple Memory Types

## Context

Different information has different lifetimes.

A single memory store mixes unrelated data.

---

# Option 1 — Single Memory Store

Architecture:

```text
Memory

↓

All Information
```

Example:

```text
[
 "User said hello",
 "User prefers TypeScript",
 "Current task progress"
]
```

---

## Problems

Cannot differentiate:

- temporary context,
- important facts,
- permanent knowledge.

---

## Decision

Rejected.

---

# Option 2 — Specialized Memory Types

Architecture:

```text
Memory Manager

├── Conversation Memory

├── Session Memory

└── Long-Term Memory
```

---

## Advantages

Each memory type has:

- different lifetime,
- different storage needs,
- different retrieval strategy.

---

## Decision

Accepted.

---

# Consequence

Memory becomes easier to optimize.

Example:

Conversation Memory:

```text
Fast access
Temporary
```

Long-Term Memory:

```text
Persistent
Semantic search
```

---

# Decision 3 — Storage Adapter Pattern

## Context

Memory should not depend on one database.

Developers may want:

- PostgreSQL,
- Redis,
- SQLite,
- Vector databases.

---

# Option 1 — Direct Database Dependency

Architecture:

```text
Memory

↓

PostgreSQL
```

---

## Problems

- Vendor lock-in.
- Difficult customization.
- Poor SDK flexibility.

---

## Decision

Rejected.

---

# Option 2 — Storage Adapter

Architecture:

```text
Memory Manager

↓

Storage Interface

↓

Implementation
```

Examples:

```text
Postgres Adapter

Redis Adapter

Vector Store Adapter
```

---

## Advantages

- Replaceable storage.
- Better testing.
- Plugin friendly.

---

## Decision

Accepted.

---

# Consequence

Developers can choose their own infrastructure.

---

# Decision 4 — Hybrid Memory Retrieval

## Context

Different queries require different retrieval methods.

---

# Option 1 — Database Search Only

Example:

```sql
Find memory where keyword matches
```

---

## Problems

Keyword search cannot understand meaning.

Example:

Stored:

```text
User enjoys backend engineering
```

Query:

```text
What technologies should I recommend?
```

Keyword matching may fail.

---

# Option 2 — Vector Search Only

Uses:

```text
Embedding

↓

Similarity Search
```

---

## Problems

Exact information retrieval becomes difficult.

Example:

```text
Find user email
```

does not require semantic search.

---

# Decision

Rejected.

---

# Option 3 — Hybrid Retrieval

Architecture:

```text
Memory Retrieval


        |

 ┌──────┴──────┐

 ▼             ▼

Structured    Semantic

Search        Search
```

---

## Advantages

Handles:

- exact data,
- meaningful relationships.

---

## Decision

Accepted.

---

# Decision 5 — LLM-Based Memory Extraction

## Context

The system needs to decide what information becomes memory.

---

# Option 1 — Store Everything

Flow:

```text
Conversation

↓

Store Everything
```

---

## Problems

Creates memory pollution.

Example:

Stored forever:

```text
Hello

Thanks

Okay
```

---

## Decision

Rejected.

---

# Option 2 — LLM Extracts Important Memories

Flow:

```text
Conversation

↓

Memory Extractor

↓

Important Information

↓

Memory Store
```

---

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

## Advantages

- Human-like memory.
- Less unnecessary storage.
- Better retrieval quality.

---

## Decision

Accepted.

---

# Consequences

## Positive Consequences

### Clear Architecture

Memory responsibility is isolated.

---

### Flexible Storage

Developers are not locked into one database.

---

### Better Retrieval

Both exact and semantic search are supported.

---

### Scalable Design

Future memory capabilities can be added.

---

# Negative Consequences

## More Components

The architecture becomes larger.

Instead of:

```text
Runtime → Database
```

we have:

```text
Runtime

↓

Memory Manager

↓

Storage Adapter

↓

Database
```

---

## More Design Complexity

Multiple memory types require additional management.

---

# Architectural Rules

## Rule 1

Runtime must never directly access memory storage.

---

## Rule 2

Memory Manager owns all memory operations.

---

## Rule 3

Conversation, Session, and Long-Term memory remain separate.

---

## Rule 4

Storage implementations must follow adapter contracts.

---

## Rule 5

Memory retrieval should provide only relevant context to the LLM.

---

# Impact on Other Components

---

# Runtime

Uses Memory Manager.

```text
Runtime

↓

Memory Manager
```

---

# Provider

Receives prepared context.

Provider does not know memory exists.

---

# Tools

Tool results may become memories.

Example:

```text
Tool Result

↓

Memory Extractor

↓

Stored Knowledge
```

---

# Guardrails

Future integration:

Prevent storing:

- secrets,
- private information,
- unsafe content.

---

# Final Decision Table

| Decision                   | Result   |
| -------------------------- | -------- |
| Memory inside Runtime      | Rejected |
| Separate Memory System     | Accepted |
| Single memory type         | Rejected |
| Multiple memory types      | Accepted |
| Direct database dependency | Rejected |
| Storage adapter            | Accepted |
| Only keyword search        | Rejected |
| Only vector search         | Rejected |
| Hybrid retrieval           | Accepted |
| Store everything           | Rejected |
| LLM memory extraction      | Accepted |

---

# Final Statement

The Memory Architecture gives Agni SDK a scalable way to provide agents with context and experience.

The system separates:

```text
Runtime

=
Execution Control


Memory

=
Knowledge Management
```

By introducing specialized memory types, storage abstraction, and hybrid retrieval, Agni SDK can evolve from simple conversations into persistent intelligent agents.
