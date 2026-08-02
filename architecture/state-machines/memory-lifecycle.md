# Memory Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Memory System
**Diagram:** Memory State Transitions
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes the lifecycle of a memory inside Agni SDK.

A memory is not immediately stored after creation.

It moves through multiple stages:

- extraction,
- validation,
- persistence,
- retrieval,
- update,
- removal.

The state machine ensures that memory transitions happen in a controlled and predictable way.

---

# 2. Memory Lifecycle Overview

High-level lifecycle:

```text id="3j1xk4"
CREATED

   |

   v

EXTRACTING

   |

   v

VALIDATING

   |

   v

STORING

   |

   v

AVAILABLE

   |

   v

RETRIEVED

   |

   v

UPDATED

   |

   v

DELETED
```

---

# 3. Memory States

The Memory System contains the following states:

```text id="f8o2ad"
CREATED

EXTRACTING

VALIDATING

STORING

AVAILABLE

RETRIEVED

UPDATED

DELETED

FAILED
```

---

# 4. State Definitions

---

# CREATED

## Meaning

A potential memory has been identified.

At this stage, the system only has raw information.

Example:

```text id="8d7m2c"
Conversation:

"I prefer TypeScript."
```

Memory candidate:

```text id="3j5b8x"
Possible Memory:

User prefers TypeScript
```

---

## Allowed Transitions

```text id="2p9k5a"
CREATED

↓

EXTRACTING
```

---

# EXTRACTING

## Meaning

The system analyzes interaction data and extracts meaningful information.

Handled by:

```text id="x1n6az"
Memory Extractor
```

Example:

Input:

```text id="5b7c1z"
"I prefer TypeScript."
```

Output:

```text id="7m9d3k"
{
 type:"preference",
 value:"typescript"
}
```

---

## Possible Outcomes

Success:

```text id="4q8y2m"
EXTRACTING

↓

VALIDATING
```

Failure:

```text id="s3j7kp"
EXTRACTING

↓

FAILED
```

---

# VALIDATING

## Meaning

The extracted memory is checked before storage.

Validation includes:

- quality checks,
- duplicate detection,
- sensitive information checks,
- schema validation.

---

Example:

Rejected:

```text id="u8c4mz"
Password:
123456
```

Accepted:

```text id="k7w2px"
User prefers TypeScript.
```

---

## Possible Outcomes

Valid:

```text id="n9a5yr"
VALIDATING

↓

STORING
```

Invalid:

```text id="w3f6qt"
VALIDATING

↓

DELETED
```

---

# STORING

## Meaning

The memory is persisted.

Handled by:

```text id="h2q8vm"
Storage Adapter
```

Possible destinations:

```text id="y5p9dn"
Database

Vector Database

Cache
```

---

## Possible Outcomes

Success:

```text id="z4m8kx"
STORING

↓

AVAILABLE
```

Failure:

```text id="p6v3as"
STORING

↓

FAILED
```

---

# AVAILABLE

## Meaning

The memory is successfully stored and can be retrieved in future runs.

Example:

```text id="e7w2qk"
Memory:

User prefers TypeScript.

Status:

Available
```

---

Possible actions:

Retrieve:

```text id="d8m4cs"
AVAILABLE

↓

RETRIEVED
```

Update:

```text id="r5n9xz"
AVAILABLE

↓

UPDATED
```

Delete:

```text id="m2q7bv"
AVAILABLE

↓

DELETED
```

---

# RETRIEVED

## Meaning

A memory has been selected and injected into an agent context.

Example:

```text id="v6p8lm"
User asks:

Recommend technologies.


Retrieved memory:

User prefers TypeScript.
```

---

Important:

Retrieval does not modify memory.

It only reads information.

---

Possible transition:

```text id="c4y7mn"
RETRIEVED

↓

AVAILABLE
```

---

# UPDATED

## Meaning

An existing memory has changed.

Example:

Old memory:

```text id="a9w3kc"
User prefers JavaScript.
```

New information:

```text id="f2r6vm"
User prefers TypeScript.
```

System updates:

```text id="p8x4zn"
User prefers TypeScript.
```

---

Possible transition:

```text id="j6m9qs"
UPDATED

↓

AVAILABLE
```

---

# DELETED

## Meaning

The memory no longer exists in active storage.

Reasons:

- user requested deletion,
- outdated information,
- invalid information,
- privacy requirement.

---

Terminal state.

```text id="q7z5kx"
DELETED

↓

END
```

---

# FAILED

## Meaning

The memory operation failed.

Possible reasons:

- extraction failure,
- validation failure,
- storage failure,
- embedding generation failure.

---

Possible recovery:

```text id="b4n8wy"
FAILED

↓

RETRY

↓

EXTRACTING / STORING
```

---

# 5. Complete State Machine Diagram

```text id="x5m9qk"
                         CREATED

                            |

                            v


                      EXTRACTING

                       /       \

                      /         \

                     v           v


              VALIDATING       FAILED


                  |

                  |

                  v


               STORING

               /     \

              /       \

             v         v


       AVAILABLE      FAILED


          |

    ┌─────┼─────┐

    |     |     |

    v     v     v


RETRIEVED UPDATED DELETED


    |       |

    |       |

    └───┬───┘

        |

        v


    AVAILABLE
```

---

# 6. State Transition Rules

| Current State | Event                 | Next State |
| ------------- | --------------------- | ---------- |
| CREATED       | Extraction started    | EXTRACTING |
| EXTRACTING    | Extraction successful | VALIDATING |
| EXTRACTING    | Extraction failed     | FAILED     |
| VALIDATING    | Memory valid          | STORING    |
| VALIDATING    | Memory rejected       | DELETED    |
| STORING       | Save successful       | AVAILABLE  |
| STORING       | Save failed           | FAILED     |
| AVAILABLE     | Retrieved             | RETRIEVED  |
| AVAILABLE     | Modified              | UPDATED    |
| AVAILABLE     | Removed               | DELETED    |
| RETRIEVED     | Context finished      | AVAILABLE  |
| UPDATED       | Update completed      | AVAILABLE  |

---

# 7. Important Invariants

The system must maintain:

---

## Invariant 1

A memory cannot become available without validation.

```text id="g5q8mr"
CREATED

❌

↓

AVAILABLE
```

Invalid.

Correct:

```text id="n3p7ax"
CREATED

↓

EXTRACTING

↓

VALIDATING

↓

STORING

↓

AVAILABLE
```

---

## Invariant 2

Retrieval never changes memory.

Reading memory should not mutate state.

---

## Invariant 3

Deleted memories cannot be retrieved.

---

## Invariant 4

Failed operations should not corrupt stored memories.

---

# 8. Edge Cases

---

## Duplicate Memory

Example:

Existing:

```text id="c7m2px"
User likes TypeScript.
```

New:

```text id="w8k4mz"
User likes TypeScript.
```

Action:

```text id="p5n9qx"
VALIDATING

↓

Ignore Duplicate
```

---

## Conflicting Memory

Example:

Old:

```text id="v4m7ks"
User prefers Python.
```

New:

```text id="x8q3nb"
User prefers TypeScript.
```

Action:

```text id="z6p2mc"
Compare

↓

Update Existing Memory
```

---

## Storage Failure

Example:

Database unavailable.

Flow:

```text id="m4x8qn"
STORING

↓

FAILED

↓

Retry
```

---

## Expired Memory

Example:

Temporary project state.

Action:

```text id="q9k3vb"
AVAILABLE

↓

DELETED
```

---

# 9. Design Principles

---

## Explicit State Management

Every memory transition is predictable.

---

## No Invalid Transitions

The system prevents corrupted memory states.

---

## Failure Isolation

Memory failures should not break agent execution.

---

## Auditability

Memory changes should be traceable.

---

## Controlled Persistence

Only validated information becomes permanent memory.

---

# Summary

The Memory Lifecycle defines how information moves through Agni SDK.

Complete lifecycle:

```text id="k4m8vp"
Raw Interaction

↓

Memory Extraction

↓

Validation

↓

Storage

↓

Available Knowledge

↓

Retrieval

↓

Update / Delete
```

The key principle:

> Memory is not created instantly. It is extracted, validated, stored, and managed through a controlled lifecycle.
