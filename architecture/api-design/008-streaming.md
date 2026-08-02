# 008 — Streaming

**Status:** Draft  
**Phase:** API Design  
**Component:** Streaming API  
**Owner:** Agni SDK

---

# Overview

Streaming defines how Agni exposes intermediate execution events while an Agent is running.

Normal execution waits until completion:

```
User Input

↓

Runtime Execution

↓

Final Response

```

Streaming exposes progress during execution:

```
User Input

↓

Runtime Events

↓

Partial Responses

↓

Tool Events

↓

Final Result

```

---

# Design Decision

Streaming is an extension of the same Runtime execution model.

It should not create a separate execution engine.

Both APIs share:

- Agent.
- Runtime.
- Provider.
- Tools.
- Context.
- Error handling.

---

# Core Mental Model

Normal:

```ts
const result = await run(agent, input);
```

Returns:

```ts
RunResult;
```

---

Streaming:

```ts
for await (const event of stream(agent, input)) {
}
```

Returns:

```ts
AsyncIterable<RunEvent>;
```

---

# Why Streaming Exists

AI applications often require real-time feedback.

Examples:

- Chat applications.
- Coding assistants.
- Long reasoning tasks.
- Document processing.
- Agent workflows.

Waiting for the final response creates poor user experience.

---

# Design Goals

Streaming should provide:

- Incremental output.
- Runtime visibility.
- Tool execution events.
- Error events.
- Final completion.

---

# Streaming API

Conceptual signature:

```ts
async function* stream<TContext>(

 agent:
 Agent<TContext>,

 input:string,

 options?:
 RunOptions<TContext>

):

AsyncIterable<RunEvent>
```

---

# Basic Usage

Example:

```ts
for await (const event of stream(agent, 'Explain RAG')) {
  console.log(event);
}
```

---

# Stream Events

Agni uses typed events.

Example:

```ts
type RunEvent =
  TextDeltaEvent | ToolCallEvent | ToolResultEvent | RunCompletedEvent | RunErrorEvent;
```

---

# Event 001 — Text Delta

Represents partial model output.

Example:

```ts
{
 type:"text_delta",

 delta:"Artificial"
}
```

---

More events:

```
Artificial

↓

Intelligence

↓

is

↓

...
```

---

# Event 002 — Tool Call

Generated when the model requests a tool.

Example:

```ts
{
 type:"tool_call",

 tool:{
   name:"get_weather",

   arguments:{
    city:"Pune"
   }
 }
}
```

---

# Event 003 — Tool Result

Generated after tool execution.

Example:

```ts
{
 type:"tool_result",

 toolName:"get_weather",

 result:{
   temperature:"28°C"
 }
}
```

---

# Event 004 — Run Started

First event.

Example:

```ts
{
 type:"run_started",

 runId:"run_123"
}
```

---

# Event 005 — Run Completed

Final event.

Example:

```ts
{
 type:"run_completed",

 result:{
   success:true,

   output:"Sunny weather"
 }
}
```

---

# Event 006 — Run Error

Represents expected failures.

Example:

```ts
{
 type:"run_error",

 error:{
   type:"provider_error"
 }
}
```

---

# Stream Lifecycle

```
RUN_STARTED

↓

MODEL_REQUEST

↓

TEXT_DELTA

↓

TOOL_CALL

↓

TOOL_RESULT

↓

TEXT_DELTA

↓

RUN_COMPLETED

```

---

# Streaming And Tools

Tools are still executed by Runtime.

Example:

```
User

↓

Provider

↓

Tool Call Event

↓

Tool Execution

↓

Tool Result Event

↓

Provider

↓

Text Stream

```

---

The user receives visibility without controlling execution.

---

# Streaming And Providers

Providers may have different streaming formats.

Example:

Gemini:

```
candidate chunks
```

OpenAI:

```
delta tokens
```

Anthropic:

```
content blocks
```

---

Provider adapters normalize these.

Architecture:

```
Provider Stream

↓

Adapter

↓

Agni Stream Events

↓

Application

```

---

# Streaming Context

Streaming uses the same Run Context.

Example:

```ts
stream(
  agent,

  input,

  {
    context: userContext,
  },
);
```

---

Context reaches:

- Tools.
- Guardrails.
- Memory.

---

# Cancellation

Streaming supports AbortSignal.

Example:

```ts
const controller = new AbortController();

for await (const event of stream(
  agent,

  input,

  {
    signal: controller.signal,
  },
)) {
}
```

---

Cancel:

```ts
controller.abort();
```

---

# Backpressure Handling

Streaming must respect consumer speed.

Problem:

```
Provider produces faster

↓

Application consumes slower

```

---

The stream implementation should:

- Avoid uncontrolled buffering.
- Respect async iteration.
- Release resources on cancellation.

---

# Error Handling

Streaming errors are represented as events.

Example:

```ts
{
 type:"run_error",

 error:{
   type:"tool_error"
 }
}
```

---

Unexpected internal failures may still throw.

---

# Relationship With run()

Important:

`run()` and `stream()` share the same Runtime.

```
              Runtime

                |

       +--------+--------+

       |                 |

      run()           stream()

       |                 |

 RunResult       Async Events

```

---

# Future Extensions

Possible future events:

## Reasoning Events

```ts
{
  type: 'reasoning_delta';
}
```

---

## Memory Events

```ts
{
  type: 'memory_retrieved';
}
```

---

## Approval Events

```ts
{
  type: 'approval_required';
}
```

---

# Public API Goals

Simple:

```ts
await run(agent, input);
```

---

Streaming:

```ts
for await (event of stream(agent, input)) {
}
```

---

Advanced:

```ts
stream(
  agent,

  input,

  {
    context,

    signal,

    maxTurns,
  },
);
```

---

# Final API Contract

Streaming is built on the same execution model as normal runs.

The API exposes:

```
Agent

+

Input

+

Run Options

↓

AsyncIterable<RunEvent>

```

---

# Final Decision

Streaming is not a separate feature.

It is another view of the same Agent execution lifecycle.

Agni keeps:

- One Runtime.
- One execution model.
- Multiple output modes.

This allows future support for real-time agents without duplicating core logic.
