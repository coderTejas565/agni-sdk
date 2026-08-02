# Memory Retrieval Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Memory System
**Diagram:** Memory Retrieval During Agent Execution
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how Agni SDK retrieves relevant memories before sending a request to the LLM.

The purpose of memory retrieval is to enrich the agent context with useful information.

The flow explains:

- how a user request enters the system,
- how Runtime requests memory,
- how different memory types are searched,
- how relevant memories are selected,
- how context is prepared for the model.

---

# 2. Memory Retrieval Overview

High-level flow:

```text
User Input

↓

Runtime

↓

Memory Manager

↓

Retrieve Relevant Memories

↓

Context Builder

↓

Provider

↓

LLM
```

---

# 3. Actors Involved

```text
User

 |

 v

Runtime

 |

 v

Memory Manager

 |

 ┌─────────────────────┐

 ▼          ▼          ▼

Conversation Session Long-Term

Memory     Memory     Memory

                       |

                       v

                Storage Adapter

                       |

          ┌────────────┼────────────┐

          ▼            ▼            ▼

      Database     Cache       Vector DB


                       |

                       v

                 Context Builder


                       |

                       v

                   Provider


                       |

                       v

                      LLM
```

---

# 4. Why Retrieval Happens Before LLM Execution

The LLM only knows information provided in the current request.

Without memory:

```text
User Question

↓

LLM

↓

Answer based only on current context
```

---

With memory:

```text
User Question

↓

Memory Retrieval

↓

Relevant Context

↓

LLM

↓

Better Response
```

---

# 5. Complete Sequence Diagram

```text
                  User

                   |

                   |

             User Request

                   |

                   v


                Runtime

                   |

                   |

        Request Relevant Context

                   |

                   v


            Memory Manager

                   |

        ┌──────────┼──────────┐

        ▼          ▼          ▼


 Conversation   Session   Long-Term

 Memory         Memory     Memory


        |          |          |

        |          |          |

        └──────────┼──────────┘

                   |

                   v


          Storage Adapter


                   |

       ┌───────────┼───────────┐

       ▼           ▼           ▼


   Database      Cache     Vector Store


                   |

                   |

          Retrieved Memories


                   |

                   v


            Context Builder


                   |

                   |

          Enriched Prompt


                   |

                   v


               Provider


                   |

                   |

                  LLM


                   |

                   |

               Response
```

---

# 6. Detailed Execution Flow

---

# Step 1 — User Sends Request

Example:

```text
Build something similar to my previous project.
```

The Runtime receives:

```text
User Input

+

Agent Configuration

+

Session Information
```

---

# Step 2 — Runtime Requests Memory

The Runtime does not search memory directly.

It delegates:

```text
Runtime

↓

Memory Manager

"Provide relevant context"
```

---

Important:

Runtime only coordinates.

It does not know:

- where memory is stored,
- how retrieval works,
- what search strategy is used.

---

# Step 3 — Memory Manager Determines Required Memory

The Memory Manager identifies required memory types.

Example:

Current request:

```text
Build something similar to my previous project.
```

Required:

```text
Conversation Memory

+

Session Memory

+

Long-Term Memory
```

---

# Step 4 — Conversation Memory Retrieval

Purpose:

Retrieve current conversation.

Example:

Previous messages:

```text
User:
Build authentication.


Assistant:
Using JWT.
```

Returned:

```text
Current conversation context
```

---

# Step 5 — Session Memory Retrieval

Purpose:

Retrieve temporary working state.

Example:

```text
Current Task:

Build LMS


Completed:

Batch Module


Pending:

Student Module
```

---

# Step 6 — Long-Term Memory Retrieval

Long-term memory uses hybrid retrieval.

---

## Structured Retrieval

Used for exact information.

Example:

Query:

```text
User preferences
```

Search:

```text
Database
```

Returns:

```text
Preference:

User prefers TypeScript
```

---

## Semantic Retrieval

Used for meaning.

Example:

Stored:

```text
User built a learning management system.
```

Query:

```text
Previous project
```

Vector search finds:

```text
LMS Project Memory
```

---

Flow:

```text
Memory

↓

Embedding Generation

↓

Vector Similarity Search

↓

Relevant Memories
```

---

# Step 7 — Memory Ranking

Retrieved memories may contain multiple results.

Example:

```text
Memory 1:
User prefers TypeScript

Memory 2:
User built LMS

Memory 3:
User likes dark themes
```

The system ranks:

```text
Most Relevant

↓

Less Relevant
```

Factors:

- similarity score,
- importance,
- freshness,
- metadata.

---

# Step 8 — Context Builder Creates Model Context

Memory should not be directly injected.

A Context Builder prepares:

```text
System Instructions

+

Conversation History

+

Session State

+

Relevant Memories

+

User Input
```

---

Example:

```text
User prefers TypeScript.

Previous project:
LMS application.

Current request:
Build similar project.
```

---

# Step 9 — Provider Sends Request To LLM

Final flow:

```text
Context Builder

↓

Provider

↓

LLM
```

The Provider only sees prepared context.

It does not know memory exists.

---

# Step 10 — Agent Generates Response

The LLM uses:

- instructions,
- user request,
- retrieved memories.

It produces final output.

---

# 7. Retrieval Failure Flows

---

# No Memory Found

Example:

New user.

Flow:

```text
Memory Manager

↓

No Results

↓

Empty Context

↓

Continue Execution
```

This is not an error.

---

# Storage Failure

Example:

Database unavailable.

Flow:

```text
Memory Manager

↓

Storage Adapter

↓

Failure

↓

Runtime
```

Possible actions:

- continue without memory,
- retry,
- fail execution.

---

# Vector Search Failure

Example:

Embedding service unavailable.

Fallback:

```text
Semantic Search Failed

↓

Use Structured Memory

↓

Continue
```

---

# 8. Responsibility Boundaries

## Runtime

Responsible for:

- requesting memory,
- continuing execution.

---

## Memory Manager

Responsible for:

- retrieval strategy,
- memory coordination.

---

## Memory Stores

Responsible for:

- storing and querying information.

---

## Context Builder

Responsible for:

- formatting information for LLM.

---

## Provider

Responsible for:

- model communication.

---

# 9. Design Principles

---

## Relevant Context Only

Do not send unnecessary memories.

Reason:

Large context increases:

- cost,
- latency,
- confusion.

---

## Memory Is Optional

Agent should work even without memory.

---

## Storage Independence

Retrieval should not depend on one database.

---

## Separation Of Concerns

Each component owns one responsibility.

---

## Context Efficiency

The system should maximize useful information per token.

---

# 10. Edge Cases

The system should handle:

- no memories found,
- conflicting memories,
- outdated memories,
- too many retrieved memories,
- duplicate memories,
- vector search timeout,
- storage unavailable,
- context window overflow,
- invalid memory format.

---

# 11. Future Improvements

Possible enhancements:

## Memory Importance Ranking

Rank memories based on usefulness.

---

## Memory Compression

Summarize old memories.

---

## User Memory Controls

Allow:

- view memories,
- edit memories,
- delete memories.

---

## Adaptive Retrieval

Change retrieval strategy based on task.

---

# Summary

The Memory Retrieval Flow allows Agni SDK agents to use previous knowledge during execution.

The complete lifecycle:

```text
User Input

↓

Runtime

↓

Memory Manager

↓

Conversation Memory
+
Session Memory
+
Long-Term Memory

↓

Context Builder

↓

Provider

↓

LLM

↓

Response
```

The key principle:

> Memory provides knowledge. Runtime provides control. The LLM provides reasoning.
