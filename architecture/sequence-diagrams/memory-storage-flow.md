# Memory Storage Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Memory System
**Diagram:** Memory Creation and Persistence Flow
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how Agni SDK creates, processes, and stores memories after an agent interaction.

The purpose of this flow is to explain:

- how conversations become memories,
- how important information is extracted,
- how memory quality is validated,
- how memories are stored,
- how existing memories are updated.

---

# 2. Memory Storage Overview

High-level flow:

```text
 id="a8q9rk"
Agent Interaction

↓

Memory Extractor

↓

Memory Validation

↓

Memory Manager

↓

Storage Adapter

↓

Database / Vector Store
```

---

# 3. Actors Involved

```text
 id="k9v6q1"
                Runtime

                   |

                   |

             Completed Run

                   |

                   v


            Memory Manager

                   |

                   v


          Memory Extractor

                   |

                   v


          Memory Validator

                   |

                   v


          Storage Adapter

                   |

        ┌──────────┼──────────┐

        ▼          ▼          ▼


    Database    Cache    Vector Store
```

---

# 4. Why Memory Storage Happens After Execution

The agent should not store every intermediate thought.

Memory should capture useful information from completed interactions.

Example:

Conversation:

```text
 id="8z5b0f"
User:
I prefer TypeScript.

Assistant:
Great, I will use TypeScript examples.
```

Useful memory:

```text
 id="m3x8kd"
Preference:

User prefers TypeScript.
```

---

Not stored:

```text
 id="9f0m4k"
Hello

Okay

Thanks
```

---

# 5. Complete Sequence Diagram

```text
 id="r0j8dw"
                 User

                  |

                  |

            User Conversation

                  |

                  v


              Runtime

                  |

                  |

           Agent Execution

                  |

                  v


            Provider / LLM

                  |

                  |

              Response

                  |

                  v


          Memory Extractor

                  |

                  |

        Identify Important Facts

                  |

                  v


          Memory Validator

                  |

                  |

          Validate Memory

                  |

                  v


          Memory Manager

                  |

                  |

        Store Memory Request

                  |

                  v


          Storage Adapter

                  |

        ┌─────────┼─────────┐

        ▼         ▼         ▼


    Database   Cache   Vector Store

                  |

                  |

             Memory Saved
```

---

# 6. Detailed Execution Flow

---

# Step 1 — Agent Completes Interaction

The Runtime finishes an agent run.

Example:

```text
 id="k1q7c5"
User:

What stack should I use?


Agent:

Since you prefer TypeScript,
I recommend Node.js.
```

---

The Runtime now has:

- user input,
- assistant response,
- execution metadata.

---

# Step 2 — Runtime Sends Interaction To Memory Manager

Runtime does not decide what becomes memory.

It delegates:

```text
 id="5j2g0h"
Runtime

↓

Memory Manager

"Process this interaction"
```

---

# Step 3 — Memory Extractor Analyzes Conversation

The Memory Extractor identifies useful information.

Input:

```text
 id="3j5m7n"
Conversation:

User prefers TypeScript.
```

Output:

```text
 id="x8k2ds"
Memory Candidate:

{
 type:"preference",
 content:"User prefers TypeScript"
}
```

---

# Step 4 — Memory Classification

The system determines memory type.

Possible categories:

```text
 id="q8m2x1"
Conversation Memory

Session Memory

Long-Term Memory
```

---

Example:

User preference:

```text
 id="f9r1q4"
Long-Term Memory
```

Current task progress:

```text
 id="u3c9p8"
Session Memory
```

---

# Step 5 — Memory Validation

Before storing:

The Memory Validator checks:

- content quality,
- duplicate information,
- invalid data,
- sensitive information.

---

Example:

Reject:

```text
 id="y5k8s2"
Password:
123456
```

Reason:

Sensitive information.

---

Accept:

```text
 id="v2x6h4"
User prefers TypeScript.
```

---

# Step 6 — Memory Manager Processes Storage

The Memory Manager decides:

- create new memory,
- update existing memory,
- ignore memory.

---

Example:

Existing:

```text
 id="d7n4q2"
User prefers JavaScript.
```

New:

```text
 id="a9m3k1"
User prefers TypeScript.
```

The system may update:

```text
 id="p4z8c6"
Preference changed.
```

---

# Step 7 — Storage Adapter Receives Request

Memory Manager does not know storage details.

Flow:

```text
 id="h3s8v1"
Memory Manager

↓

Storage Adapter

↓

Storage Implementation
```

---

Possible storage:

```text
 id="r8k4p2"
PostgreSQL

Redis

Vector Database
```

---

# Step 8 — Structured Memory Storage

Some memories are stored as normal data.

Example:

```text
 id="w2n6c8"
{
 type:"preference",
 key:"language",
 value:"typescript"
}
```

Stored in:

```text
 id="z7m1q5"
Database
```

---

# Step 9 — Semantic Memory Storage

Long-term memories require embeddings.

Flow:

```text
 id="e5x9k3"
Memory Content

↓

Embedding Generation

↓

Vector Representation

↓

Vector Database
```

Example:

Text:

```text
User likes backend engineering.
```

becomes:

```text
 id="c4v8n2"
[0.124,0.542,0.231...]
```

---

# Step 10 — Memory Becomes Available

After successful storage:

```text
 id="s6p3y8"
Memory

↓

Available For Future Retrieval
```

Future requests can use:

```text
Memory Retrieval Flow
```

---

# 7. Memory Update Flow

Memories are not always created.

Sometimes they change.

Example:

Old:

```text
User prefers Python.
```

New:

```text
User now prefers TypeScript.
```

Flow:

```text
 id="m8q2v4"
New Memory

↓

Find Similar Memories

↓

Compare

↓

Update Existing Memory

or

Create New Memory
```

---

# 8. Failure Flows

---

# Memory Extraction Failure

Example:

LLM extraction fails.

Flow:

```text
 id="b7r3p9"
Conversation

↓

Extractor Failure

↓

Continue Without Memory
```

The agent response should not fail.

---

# Storage Failure

Example:

Database unavailable.

Flow:

```text
 id="n5k8x1"
Memory Manager

↓

Storage Adapter

↓

Failure
```

Possible actions:

- retry,
- queue for later,
- log failure.

---

# Duplicate Memory

Example:

Existing:

```text
User likes TypeScript.
```

New:

```text
User likes TypeScript.
```

Solution:

```text
 id="q4m9z7"
Similarity Check

↓

Ignore Duplicate
```

---

# 9. Responsibility Boundaries

---

## Runtime

Responsible for:

- providing completed interaction,
- continuing execution.

---

## Memory Extractor

Responsible for:

- identifying important information.

---

## Memory Validator

Responsible for:

- checking memory quality,
- enforcing policies.

---

## Memory Manager

Responsible for:

- coordinating storage.

---

## Storage Adapter

Responsible for:

- communicating with storage systems.

---

# 10. Design Principles

---

## Store Knowledge, Not Conversations

Avoid memory pollution.

---

## Memory Creation Is Controlled

Not every interaction becomes memory.

---

## Storage Independence

Memory logic should not depend on one database.

---

## Safe Persistence

Sensitive information should not be stored.

---

## Idempotency

Repeated storage requests should not create duplicates.

---

# 11. Edge Cases

The system should handle:

- duplicate memories,
- conflicting memories,
- extraction errors,
- storage downtime,
- embedding failures,
- invalid memory format,
- sensitive information detection,
- outdated memories,
- excessive memory growth.

---

# 12. Future Improvements

---

## Memory Importance Score

Example:

```text
High Importance:
User preference

Low Importance:
Temporary discussion
```

---

## Memory Expiration

Remove outdated information.

---

## Memory Review

Allow users to approve memories.

---

## Background Processing

Move extraction to asynchronous workers.

---

# Summary

The Memory Storage Flow defines how Agni SDK converts agent interactions into persistent knowledge.

Complete lifecycle:

```text
 id="y7h2m9"
Agent Interaction

↓

Memory Extractor

↓

Memory Validation

↓

Memory Manager

↓

Storage Adapter

↓

Database / Vector Store

↓

Future Retrieval
```

The key principle:

> Agents should not remember everything. They should remember what is valuable.
