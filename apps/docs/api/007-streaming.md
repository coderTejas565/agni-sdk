```md
# Streaming

**Status:** Public API Documentation  
**Component:** Streaming API  
**Package:** Agni SDK

---

# Overview

Agni SDK supports streaming responses for applications that need real-time updates while an Agent is running.

Instead of waiting for the complete response:
```

User Input

↓

Agent Execution

↓

Final Response

```

Streaming allows applications to receive execution events as they happen:

```

User Input

↓

Agent Starts

↓

Response Chunks

↓

Tool Calls

↓

Tool Results

↓

Final Response

````

---

# When To Use Streaming

Streaming is useful for:

- Chat applications.
- AI assistants.
- Coding tools.
- Long-running agent tasks.
- Real-time user interfaces.

---

# Basic Usage

Normal execution:

```ts
const result = await run(
  agent,
  "Explain vector databases"
);
````

returns only after completion.

---

Streaming:

```ts
for await (const event of stream(agent, 'Explain vector databases')) {
  console.log(event);
}
```

Events are received during execution.

---

# Stream Function

Conceptual API:

```ts
async function* stream<TContext>(

  agent: Agent<TContext>,

  input: string,

  options?: RunOptions<TContext>

): AsyncIterable<RunEvent>
```

---

# Stream Events

Streaming returns typed execution events.

Common events:

- Run started.
- Text chunks.
- Tool calls.
- Tool results.
- Completion.
- Errors.

---

# Event Types

## Run Started

The first event emitted when execution begins.

Example:

```ts
{
  type: "run_started",

  runId: "run_123"
}
```

---

# Text Delta

Represents partial generated text.

Example:

```ts
{
  type: "text_delta",

  delta: "Artificial"
}
```

Next event:

```ts
{
  type: "text_delta",

  delta: " Intelligence"
}
```

The application can combine these chunks.

---

# Tool Call Event

Emitted when the model requests a tool execution.

Example:

```ts
{
  type: "tool_call",

  tool: {

    name: "get_weather",

    arguments: {
      city: "Mumbai"
    }

  }
}
```

---

# Tool Result Event

Emitted after a tool completes.

Example:

```ts
{
  type: "tool_result",

  toolName: "get_weather",

  result: {

    temperature: "28°C",

    condition: "Sunny"

  }
}
```

---

# Run Completed

The final event after successful execution.

Example:

```ts
{
  type: "run_completed",

  result: {

    success: true,

    output:
      "The weather is sunny."

  }
}
```

---

# Run Error

Emitted when execution fails.

Example:

```ts
{
  type: "run_error",

  error: {

    type: "provider_error",

    message:
      "Model unavailable"

  }
}
```

---

# Complete Streaming Flow

Example:

User asks:

```
What is the weather in Mumbai?
```

Execution:

```
RUN_STARTED

↓

MODEL_REQUEST

↓

TOOL_CALL

↓

TOOL_RESULT

↓

TEXT_DELTA

↓

TEXT_DELTA

↓

RUN_COMPLETED
```

---

# Streaming With Context

Streaming supports the same context system as `run()`.

Example:

```ts
interface AppContext {
  userId: string;
}

for await (const event of stream(
  agent,

  'Show my profile',

  {
    context: {
      userId: '123',
    },
  },
)) {
}
```

The context is available inside:

- Tools.
- Guardrails.
- Memory.

---

# Streaming With Tools

Tools are still controlled by the Runtime.

The application only receives events.

Flow:

```
Agent

↓

Model decides tool

↓

Runtime executes tool

↓

Tool Result Event

↓

Model continues

↓

Final Output
```

---

# Streaming Does Not Change Execution

Important:

`run()` and `stream()` use the same Agent execution engine.

```
                 Runtime

                    |

        +-----------+-----------+

        |                       |

       run()                stream()

        |                       |

   RunResult             RunEvents

```

---

# Cancellation

Streaming supports cancellation using `AbortSignal`.

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

Cancel execution:

```ts
controller.abort();
```

---

# Error Handling

Streaming uses the same error model as `run()`.

Expected failures are returned as events.

Example:

```ts
{
 type:"run_error",

 error:{
   type:"tool_error"
 }
}
```

Unexpected SDK failures may throw.

---

# Streaming And Providers

Applications do not interact directly with provider streams.

Agni normalizes provider-specific streaming formats.

Example:

```
Gemini Stream

↓

Gemini Adapter

↓

Agni Stream Events

↓

Application

```

The application always receives Agni events.

---

# Best Practices

## Update UI on text events

Example:

```ts
if (event.type === 'text_delta') {
  appendText(event.delta);
}
```

---

## Show tool progress

Example:

```ts
if (event.type === 'tool_call') {
  showLoading(event.tool.name);
}
```

---

## Handle completion

Example:

```ts
if (event.type === 'run_completed') {
  finish();
}
```

---

# Future Extensions

Future streaming events may include:

- Memory retrieval.
- Agent handoffs.
- Approval requests.
- Observability traces.

Example:

```ts
{
  type: 'approval_required';
}
```

---

# Summary

Streaming provides real-time visibility into Agent execution.

It allows applications to receive:

- Generated text.
- Tool activity.
- Runtime progress.
- Completion state.
- Errors.

The execution model remains the same as `run()`.

Only the output interface changes:

```
run()

Agent

↓

RunResult


stream()

Agent

↓

AsyncIterable<RunEvent>
```

```

```
