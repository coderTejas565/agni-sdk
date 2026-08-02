# 002 — Provider Adapter

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Provider System  
**Owner:** Agni SDK

---

# Overview

The Provider Adapter is the implementation layer that connects an external AI provider SDK with the Agni SDK Provider Interface.

The Adapter translates:

```
Agni Internal Types

        ↓

Provider Adapter

        ↓

External AI SDK

        ↓

AI Provider API
```

Each provider gets its own adapter implementation.

Examples:

```
Gemini Adapter

OpenAI Adapter

Anthropic Adapter
```

---

# Design Goal

The Provider Adapter exists to:

- Hide provider SDK differences.
- Convert Agni requests into provider requests.
- Convert provider responses into Agni responses.
- Keep Runtime provider-independent.
- Allow multiple providers without changing core architecture.

---

# Architecture Position

```
                 Runtime

                    |

                    |

            Provider Interface

                    |

                    |

            Provider Adapter

                    |

        +-----------+-----------+

        |           |           |

     Gemini      OpenAI     Anthropic

        |           |           |

    SDK Client  SDK Client  SDK Client

```

---

# Core Principle

The Adapter is a translation boundary.

It converts:

```
Agni Language

↓

Provider Language
```

and:

```
Provider Language

↓

Agni Language
```

The Runtime never crosses this boundary.

---

# Example

Runtime sends:

```ts
{
 messages:[
   {
    role:"user",
    content:"Weather in Pune?"
   }
 ],

 tools:[
   weatherTool
 ]
}
```

The Gemini Adapter converts this into:

```ts
{
 contents:[
   {
    role:"user",
    parts:[
      {
       text:"Weather in Pune?"
      }
    ]
   }
 ],

 tools:[
   {
    functionDeclarations:[
      ...
    ]
   }
 ]
}
```

The Runtime never knows this transformation happened.

---

# Adapter Responsibilities

---

# 1. Request Translation

Convert:

```
Agni ProviderRequest
```

into:

```
Provider SDK Request
```

Example:

Agni:

```ts
interface Message {
  role: 'user' | 'assistant';

  content: string;
}
```

Gemini:

```ts
{
 role:"user",

 parts:[
  {
   text:"hello"
  }
 ]
}
```

---

# 2. Tool Definition Translation

Agni Tool:

```ts
{
 name:"get_weather",

 description:
 "Get weather",

 parameters:{}
}
```

Gemini:

```ts
{
  functionDeclarations: [
    {
      name: 'get_weather',
    },
  ];
}
```

OpenAI:

```ts
{
 type:"function",

 function:{
  name:"get_weather"
 }
}
```

---

# 3. Response Normalization

Provider responses are different.

The Adapter converts them into:

```ts
AgniResponse;
```

Example:

Gemini:

```ts
{
 functionCall:{
   name:"get_weather",
   args:{
    city:"Pune"
   }
 }
}
```

Becomes:

```ts
{
 type:"tool_call",

 toolCall:{
   name:"get_weather",

   arguments:{
    city:"Pune"
   }
 }
}
```

---

# 4. Streaming Translation

Streaming formats differ.

Example:

Gemini:

```
chunk.text()
```

OpenAI:

```
delta.content
```

Anthropic:

```
content_block_delta
```

Adapter converts all into:

```ts
ProviderChunk;
```

Example:

```ts
{
 type:"text_delta",

 content:"Hello"
}
```

---

# Adapter Interface

Conceptually:

```ts
interface ProviderAdapter {
  generate(request: ProviderRequest): Promise<ProviderResponse>;

  stream(request: ProviderRequest): AsyncIterable<ProviderChunk>;
}
```

---

# Gemini Adapter Example

Internal:

```
GeminiProviderAdapter
```

Responsibilities:

```
Agni Request

↓

Gemini Request Builder

↓

Google SDK

↓

Gemini Response Parser

↓

Agni Response

```

---

# Folder Structure

Recommended:

```
src/

providers/

├── core/
│   ├── provider.ts
│   ├── types.ts
│
├── gemini/
│   ├── gemini-provider.ts
│   ├── request-mapper.ts
│   ├── response-parser.ts
│
├── openai/
│   ├── openai-provider.ts
│   ├── request-mapper.ts
│   └── response-parser.ts
│
└── anthropic/
    ├── anthropic-provider.ts
    ├── request-mapper.ts
    └── response-parser.ts
```

---

# Why Separate Mapper and Parser?

Bad:

```ts
gemini-provider.ts

1000 lines
```

Contains:

- Request building.
- Response parsing.
- Error handling.
- Streaming.

Hard to maintain.

---

Better:

```
Gemini Provider

      |
      |

Request Mapper

      |
      |

Gemini SDK

      |
      |

Response Parser
```

Each part has one responsibility.

---

# Provider Error Translation

External errors:

Gemini:

```
429 RESOURCE_EXHAUSTED
```

OpenAI:

```
RateLimitError
```

Anthropic:

```
overloaded_error
```

Adapter converts:

```ts
{
 type:"rate_limit",

 retryable:true,

 provider:"gemini"
}
```

---

# Provider Specific Features

The Adapter may expose optional provider capabilities.

Example:

Gemini:

```ts
{
  grounding: true;
}
```

OpenAI:

```ts
{
  reasoning: true;
}
```

These should not modify the core interface.

---

# Provider Options Flow

User:

```ts
new Agent({
  model: gemini({
    providerOptions: {
      safetySettings: [],
    },
  }),
});
```

Flow:

```
Agent

↓

Runtime

↓

Provider Interface

↓

Gemini Adapter

↓

Gemini SDK
```

---

# Testing Strategy

Each Adapter should be tested independently.

Example:

```
Gemini Adapter Tests

├── request mapping
├── tool conversion
├── response parsing
├── error normalization
└── streaming
```

The Runtime does not need provider-specific tests.

---

# Alternatives Considered

---

## Put Provider Conversion Inside Runtime

Rejected.

Reason:

Runtime becomes coupled to every provider.

---

## Make Runtime Handle All Provider Formats

Rejected.

Example:

```ts
if(provider==="gemini")

else if(provider==="openai")
```

Problems:

- Runtime grows forever.
- New providers require core changes.

---

## Expose Provider SDK Directly

Rejected.

Example:

```ts
agent.model = new GoogleGenAI();
```

Problems:

- No abstraction.
- Poor portability.
- Provider lock-in.

---

# Design Decisions

## Decision 001 — Every Provider Has Its Own Adapter

Accepted.

Reason:

Provider differences stay isolated.

---

## Decision 002 — Adapter Owns Translation

Accepted.

Reason:

Translation belongs at the boundary.

---

## Decision 003 — Runtime Only Uses Internal Types

Accepted.

Reason:

Core execution remains stable.

---

# Final Decision

Agni SDK uses Provider Adapters as the isolation layer between the framework and external AI providers.

Final architecture:

```
Application

↓

Agent

↓

Runtime

↓

Provider Interface

↓

Provider Adapter

↓

AI Provider SDK

↓

Model
```

This allows Agni SDK to support multiple AI providers while keeping the core agent runtime clean, stable, and provider-independent.
