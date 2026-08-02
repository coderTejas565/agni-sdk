# 003 — Provider Request Response Flow

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Provider System  
**Owner:** Agni SDK

---

# Overview

The Provider Request Response Flow defines how data moves between the Agni Runtime and external AI providers.

This document explains:

- How Runtime creates provider requests.
- How Provider Adapters translate requests.
- How AI providers respond.
- How responses are normalized back into Agni internal types.

The goal is to keep the Runtime completely independent from provider-specific APIs.

---

# Core Principle

The Runtime communicates only with Agni internal types.

```
Runtime

X

Gemini Format

X

OpenAI Format


Runtime

↓

Agni Provider Interface

↓

Provider Adapter

↓

External Provider
```

---

# Complete Architecture Flow

```
Application

↓

run(agent,input)

↓

Runtime

↓

Provider Interface

↓

Provider Adapter

↓

AI Provider SDK

↓

LLM

↓

Provider SDK Response

↓

Provider Adapter

↓

Agni Response

↓

Runtime

↓

Agent Loop
```

---

# Request Flow

## Step 1 — User Starts Execution

Example:

```ts
await run(agent, 'Explain TypeScript');
```

Runtime creates an execution.

Internal state:

```
Run

├── Input
├── Context
├── Messages
├── Tools
└── Provider
```

---

# Step 2 — Runtime Builds Provider Request

Runtime creates an Agni request.

Example:

```ts
{
 messages:[
  {
   role:"user",
   content:"Explain TypeScript"
  }
 ],

 tools:[],

 options:{
   temperature:0.7
 }
}
```

Important:

This is not Gemini/OpenAI format.

This belongs to Agni.

---

# Step 3 — Runtime Calls Provider

Runtime:

```ts
await provider.generate(request);
```

Flow:

```
Runtime

↓

Provider Interface

↓

Adapter
```

---

# Step 4 — Adapter Translates Request

Example:

Agni:

```ts
{
 role:"user",
 content:"Hello"
}
```

Gemini:

```ts
{
 role:"user",

 parts:[
  {
   text:"Hello"
  }
 ]
}
```

Transformation:

```
Agni Request

↓

Request Mapper

↓

Provider Request
```

---

# Step 5 — External Provider Call

Adapter uses provider SDK.

Example:

```
Gemini Adapter

↓

Google SDK

↓

Gemini API
```

The Provider API performs:

- Token processing.
- Model inference.
- Tool decision.
- Response generation.

---

# Response Flow

## Step 6 — Provider Returns Response

Different providers return different structures.

Example Gemini:

```ts
{
  candidates: [
    {
      content: {
        parts: [
          {
            text: 'Hello',
          },
        ],
      },
    },
  ];
}
```

---

Example OpenAI:

```ts
{
  choices: [
    {
      message: {
        content: 'Hello',
      },
    },
  ];
}
```

---

Example Anthropic:

```ts
{
  content: [
    {
      type: 'text',
      text: 'Hello',
    },
  ];
}
```

---

# Step 7 — Adapter Normalizes Response

The Adapter converts all formats into:

```ts
AgniResponse;
```

Example:

```ts
{
 type:"text",

 content:"Hello"
}
```

or:

```ts
{
 type:"tool_call",

 toolCall:{
   name:"weather",

   arguments:{
    city:"Pune"
   }
 }
}
```

---

# Step 8 — Runtime Processes Response

Runtime receives:

```
Agni Response
```

Not:

```
Gemini Response
```

Decision:

```
Response Type

        |

        +-------------+

        |             |

      Text        Tool Call

        |             |

     Finish       Execute Tool
```

---

# Tool Call Request Flow

Example:

User:

```
Weather in Pune?
```

---

Flow:

```
User

↓

Runtime

↓

Provider Request

↓

Gemini Adapter

↓

Gemini

↓

Tool Call Response

↓

Adapter

↓

Agni ToolCall

↓

Runtime

↓

Tool Registry

↓

Tool Execution
```

---

# Tool Result Continuation

After tool execution:

Tool:

```json
{
  "temperature": "28°C"
}
```

Runtime creates:

```ts
{
 role:"tool",

 name:"weather",

 result:{
  temperature:"28°C"
 }
}
```

Then:

```
Runtime

↓

Provider

↓

Model

↓

Final Answer
```

---

# Multi-Turn Conversation Flow

Example:

```
Message 1

User:
Weather?


Message 2

Model:
Call weather tool


Message 3

Tool:
Weather data


Message 4

Model:
Final response
```

The Runtime maintains:

```
Message History

+

Tool Results

+

Context
```

and sends the complete state back to the Provider.

---

# Streaming Request Flow

For streaming:

```
Runtime

↓

provider.stream()

↓

Adapter

↓

Provider SDK Stream

↓

Chunks

↓

Adapter

↓

Agni Stream Events

↓

Application
```

Example chunk:

```ts
{
 type:"text_delta",

 content:"Hel"
}
```

---

# Abort / Cancellation Flow

Example:

User cancels request.

```
User

↓

AbortController

↓

Runtime

↓

Provider Request

↓

Adapter

↓

Provider SDK

```

Provider receives:

```ts
AbortSignal;
```

and stops the request.

---

# Error Flow

Provider failures are normalized.

Example:

Gemini:

```
429 RESOURCE_EXHAUSTED
```

Adapter converts:

```ts
{
 type:"rate_limit",

 retryable:true
}
```

Flow:

```
Provider

↓

Adapter

↓

Agni Error

↓

Runtime Policy

↓

Retry / Fail
```

---

# Observability Points

The Provider lifecycle creates events.

Example:

```
provider.request.started

↓

provider.request.completed

↓

provider.response.received

↓

provider.error
```

These events are consumed by:

- Tracing.
- Metrics.
- Debugging.

---

# Sequence Diagram

```
Application

    |

    | run()

    ↓

Runtime

    |

    | generate()

    ↓

Provider Interface

    |

    ↓

Provider Adapter

    |

    | map request

    ↓

External SDK

    |

    ↓

AI Model

    |

    | response

    ↓

External SDK

    |

    ↓

Response Parser

    |

    ↓

Agni Response

    |

    ↓

Runtime
```

---

# Design Decisions

---

## Decision 001 — Runtime Uses Internal Models

Accepted.

Reason:

Prevents provider lock-in.

---

## Decision 002 — Adapter Owns Translation

Accepted.

Reason:

Provider differences stay isolated.

---

## Decision 003 — Responses Are Normalized Before Runtime

Accepted.

Reason:

Runtime complexity remains stable as providers increase.

---

# Final Decision

The Provider communication architecture is:

```
Runtime

↓

Provider Interface

↓

Provider Adapter

↓

External AI Provider

↓

Provider Adapter

↓

Runtime
```

The Provider System acts as a boundary that protects Agni Core from external AI provider changes.

This allows Gemini, OpenAI, Anthropic, and future providers to work through the same execution engine.
