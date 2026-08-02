# Provider Request Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Provider Layer
**Diagram:** Provider Request and Response Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes how a request flows through the Provider Layer.

The goal is to visualize:

- how Runtime communicates with Provider,
- how Provider adapters translate requests,
- how external model APIs are called,
- how responses are normalized.

This diagram focuses only on model communication.

---

# 2. Provider Flow Overview

The Provider lifecycle:

```text
 id="c4m7xs"
Runtime Request

↓

Provider Interface

↓

Provider Adapter

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

# 3. Actors Involved

```text
 id="r7m2kf"
Developer

↓

Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External Model API

↓

LLM Model
```

---

# 4. High-Level Sequence Diagram

```text
 id="8zv5qi"
Runtime

    |
    |
    | generate(request)
    |
    v

Provider Interface

    |
    |
    | forward request
    |
    v

Provider Adapter

    |
    |
    | transform format
    |
    v

External Model API

    |
    |
    | model response
    |
    v

Provider Adapter

    |
    |
    | normalize response
    |
    v

Provider Interface

    |
    |
    v

Runtime
```

---

# 5. Detailed Execution Flow

---

# Step 1 — Runtime Creates Model Request

The Runtime has already prepared:

- agent instructions,
- conversation context,
- user input,
- available tools.

It creates a model request.

Example:

```text
 id="q6g3yz"
Runtime

↓

Provider.generate(request)
```

The Runtime does not know:

- which provider is used,
- which SDK is called,
- which API format exists.

---

# Step 2 — Provider Interface Receives Request

The Provider Interface acts as the contract between Runtime and providers.

Responsibilities:

- receive normalized request,
- select provider implementation,
- forward execution.

Flow:

```text
 id="j5x9pq"
Runtime

↓

Provider Interface

↓

Provider Adapter
```

---

# Step 3 — Provider Adapter Translates Request

Each external provider has different requirements.

Example:

Agni format:

```text
 id="w2m8zs"
{
 messages,
 tools,
 model,
 options
}
```

OpenAI format:

```text
 id="p8v4kd"
{
 messages,
 functions,
 model
}
```

Claude format:

```text
 id="n6r3ha"
{
 messages,
 tools,
 model
}
```

The adapter converts:

```text
 id="z5k1mj"
Agni Request

↓

Provider Request
```

---

# Step 4 — External Model API Call

The adapter communicates with the external provider.

Example:

```text
 id="v4m8q1"
OpenAI Adapter

↓

OpenAI API

↓

GPT Model
```

or:

```text
 id="q7p2kc"
Claude Adapter

↓

Anthropic API

↓

Claude Model
```

---

# Step 5 — Model Generates Response

The model processes:

- instructions,
- conversation,
- available tools.

The response may contain:

## Final Answer

Example:

```text
 id="n9q5xz"
"I found the information..."
```

---

## Tool Call

Example:

```text
 id="r3k7mq"
{
 tool:"weather",
 arguments:{city:"Mumbai"}
}
```

The Provider does not execute this.

It only returns the information.

---

# Step 6 — Provider Adapter Normalizes Response

Different providers return different response formats.

Example:

OpenAI:

```text
 id="p5x2kf"
choices[0].message
```

Claude:

```text
 id="w8m3qp"
content[0].text
```

Gemini:

```text
 id="d7k1zm"
candidates[0]
```

The adapter converts them into Agni format.

Flow:

```text
 id="m9q2zs"
Provider Response

↓

Normalized Agni Response
```

---

# Step 7 — Runtime Receives Response

Runtime receives:

```text
 id="b3v7hx"
{
 content,
 toolCalls,
 usage,
 finishReason
}
```

Runtime then decides:

- complete execution,
- execute tools,
- continue loop.

The Provider has no control over this decision.

---

# 6. Complete Sequence Diagram

```text
 id="f8r1mc"

Runtime

  |
  |
  | generate(request)
  |
  v

Provider Interface

  |
  |
  | execute()
  |
  v

Provider Adapter

  |
  |
  | convert request
  |
  v

External AI API

  |
  |
  | request
  |
  v

LLM Model

  |
  |
  | response
  |
  v

External AI API

  |
  |
  v

Provider Adapter

  |
  |
  | normalize response
  |
  v

Provider Interface

  |
  |
  v

Runtime
```

---

# 7. Streaming Flow

Streaming follows a similar path.

Difference:

Instead of returning one response:

```text
 id="t6p8mv"
Complete Response
```

Provider emits chunks:

```text
 id="s4k9xz"
Chunk 1

↓

Chunk 2

↓

Chunk 3

↓

Final Chunk
```

Flow:

```text
 id="h7q2wp"
Runtime

↓

Provider Stream

↓

Adapter

↓

External API Stream

↓

Adapter

↓

Runtime Events
```

---

# 8. Failure Flow

Provider failures are translated before reaching Runtime.

---

## Authentication Failure

Example:

```text
 id="m4v8ks"
External API

↓

Invalid API Key

↓

Provider Error

↓

Runtime
```

---

## Timeout

```text
 id="k2p7zq"
Model Timeout

↓

Provider Error

↓

Failure Manager
```

---

## Invalid Response

```text
 id="q5n9xm"
Unexpected Response

↓

Adapter Validation

↓

Provider Error
```

---

# 9. Provider Responsibilities in Flow

During execution Provider is responsible for:

```text
 id="y8m3qf"
✓ Request translation

✓ API communication

✓ Response translation

✓ Provider error conversion

✓ Streaming handling
```

---

Provider is NOT responsible for:

```text
 id="x3k7pn"
✗ Tool execution

✗ Retry decisions

✗ Agent loop

✗ Memory updates

✗ Business logic
```

---

# 10. Design Notes

The sequence demonstrates the separation:

```text
 id="p6q2mz"
Runtime

"What should happen next?"



Provider

"How do I communicate with this model?"
```

This separation allows:

- multiple providers,
- independent evolution,
- simpler testing,
- cleaner architecture.

---

# Summary

The Provider Request Flow defines the communication pipeline between Agni SDK Runtime and external AI providers.

The complete flow is:

```text
 id="x8v5mq"
Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External Model API

↓

Provider Adapter

↓

Normalized Response

↓

Runtime
```

The Provider Layer acts as a stable translation boundary, allowing Agni SDK to support a changing AI ecosystem without changing its core execution engine.
