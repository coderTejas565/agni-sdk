# 004 — Provider Response Normalization

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Provider System  
**Owner:** Agni SDK

---

# Overview

Provider Response Normalization defines how Agni SDK converts different AI provider responses into a single internal response format.

Every AI provider has its own response structure.

Examples:

- Gemini Function Calls
- OpenAI Tool Calls
- Anthropic Tool Use Blocks

The Runtime should not understand any of these formats.

The Provider Adapter converts all responses into Agni internal types.

---

# Core Principle

External responses should never leak into the core runtime.

Incorrect:

```
Gemini Response

↓

Runtime

↓

Tool Execution
```

Correct:

```
Gemini Response

↓

Gemini Adapter

↓

Agni Response

↓

Runtime
```

---

# Problem

Different providers represent the same concept differently.

Example:

A model wants to call:

```
get_weather({
 city:"Pune"
})
```

---

## Gemini

Response:

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

---

## OpenAI

Response:

```ts
{
  tool_calls: [
    {
      function: {
        name: 'get_weather',

        arguments: '{"city":"Pune"}',
      },
    },
  ];
}
```

---

## Anthropic

Response:

```ts
{
  content: [
    {
      type: 'tool_use',

      name: 'get_weather',

      input: {
        city: 'Pune',
      },
    },
  ];
}
```

---

The Runtime should not contain:

```ts
if(provider==="gemini")

else if(provider==="openai")
```

---

# Agni Internal Response Model

All providers convert into:

```ts
type ProviderResponse = TextResponse | ToolCallResponse;
```

---

# Text Response

Example:

```ts
{
 type:"text",

 content:
 "The weather is sunny."
}
```

Used when:

- Model completed the task.
- No tools are required.

---

# Tool Call Response

Example:

```ts
{
 type:"tool_call",

 toolCall:{
   id:"call_123",

   name:"get_weather",

   arguments:{
    city:"Pune"
   }
 }
}
```

Used when:

- Model requests a tool.
- Runtime must execute an action.

---

# Response Normalization Flow

```
External Provider Response

          |

          ↓

Provider Adapter

          |

          ↓

Response Parser

          |

          ↓

Agni Internal Response

          |

          ↓

Runtime
```

---

# Response Parser Responsibility

Each provider owns its parser.

Example:

```
providers/

gemini/

├── response-parser.ts


openai/

├── response-parser.ts


anthropic/

├── response-parser.ts
```

---

# Gemini Parser Example

Input:

```ts
GeminiGenerateContentResponse;
```

Output:

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

The parser hides:

- Gemini SDK types.
- Gemini response structure.
- Gemini naming conventions.

---

# Multiple Tool Calls

Some providers support multiple tool calls.

Example:

```ts
[
  {
    name: 'weather',
  },

  {
    name: 'calendar',
  },
];
```

Agni should support:

```ts
{
 type:"tool_calls",

 toolCalls:[
  {
   name:"weather"
  },

  {
   name:"calendar"
  }
 ]
}
```

---

# Why Support Multiple Tool Calls?

Future agent workflows may require:

Example:

```
User

↓

Need weather + calendar

↓

Weather Tool

+

Calendar Tool

↓

Final Response
```

---

# Tool Call ID

Every tool call should have an identifier.

Example:

```ts
{
 id:"tool_call_001",

 name:"weather"
}
```

Why?

Needed for:

- Parallel execution.
- Tracing.
- Debugging.
- Matching results.

---

# Invalid Responses

Providers may return malformed responses.

Examples:

Missing name:

```ts
{
  functionCall: {
    args: {
    }
  }
}
```

Missing arguments:

```ts
{
  name: 'weather';
}
```

The Adapter must validate.

---

# Validation Flow

```
Provider Response

↓

Parser

↓

Schema Validation

↓

Valid

      |

      ↓

Agni Response


Invalid

      |

      ↓

Provider Error
```

---

# Response Normalization Errors

Example:

```ts
{
 type:"provider_error",

 message:
 "Invalid tool call format"
}
```

The Runtime receives a controlled error.

---

# Structured Output

Future providers may support:

```
JSON Mode

↓

Schema Output

↓

Structured Response
```

Agni can normalize:

```ts
{
 type:"structured_output",

 data:{}
}
```

---

# Streaming Normalization

Streaming responses are also normalized.

Provider:

Gemini:

```
text chunk
```

OpenAI:

```
delta.content
```

Anthropic:

```
content_block_delta
```

Convert to:

```ts
{
 type:"text_delta",

 content:"Hel"
}
```

---

# Provider Capability Impact

Not all providers support the same features.

Example:

```
Provider

├── Text
├── Tools
├── Streaming
└── Structured Output
```

The Adapter exposes capabilities.

Example:

```ts
{
 tools:true,

 streaming:true
}
```

---

# Error Normalization

External:

Gemini:

```ts
RESOURCE_EXHAUSTED;
```

OpenAI:

```ts
RateLimitError;
```

Anthropic:

```ts
overloaded_error;
```

Converted:

```ts
{
 type:"rate_limit",

 retryable:true
}
```

---

# Runtime Interaction

Runtime receives only:

```
Agni Response
```

Then:

```
Response Type

        |

        +------------+

        |            |

      Text      Tool Call

        |            |

    Complete     Execute Tool
```

---

# Sequence Diagram

```
AI Provider

    |

    | response

    ↓

Provider SDK

    |

    ↓

Provider Adapter

    |

    | parse()

    ↓

Response Normalizer

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

## Decision 001 — Normalize At Provider Boundary

Accepted.

Reason:

Keeps Runtime simple.

---

## Decision 002 — Runtime Never Knows Provider Types

Accepted.

Reason:

Enables multi-provider support.

---

## Decision 003 — Every Provider Owns Parsing Logic

Accepted.

Reason:

Provider differences remain isolated.

---

# Final Decision

Agni SDK uses response normalization as the boundary between AI providers and the agent runtime.

Final architecture:

```
Provider SDK

↓

Provider Adapter

↓

Response Parser

↓

Agni Internal Response

↓

Runtime
```

This keeps the core execution engine stable while allowing unlimited provider integrations.
