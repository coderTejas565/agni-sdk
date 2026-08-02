# 003 — Tool Execution Flow

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Tool System  
**Owner:** Agni SDK

---

# Overview

Tool Execution Flow describes how Agni SDK executes a Tool after a Language Model requests an action.

The execution lifecycle begins when the Provider returns a normalized tool call and ends when the result is returned back to the Agent loop.

The Runtime controls this entire process.

The Tool Registry only provides discovery and delegation.

---

# Core Principle

The Model decides:

> "I need this capability."

The Runtime decides:

> "How should this capability execute?"

The Tool decides:

> "How do I perform this operation?"

---

# High-Level Flow

```
User

↓

Runtime

↓

Provider

↓

Model Decision

↓

Tool Call

↓

Tool Registry

↓

Tool Execution

↓

Tool Result

↓

Runtime

↓

Provider

↓

Final Response
```

---

# Complete Execution Sequence

Example:

User asks:

```
"What is the weather in Pune?"
```

---

## Step 1 — User Input

Application:

```ts
run(agent, 'Weather in Pune?');
```

Runtime starts execution.

---

## Step 2 — Provider Call

Runtime sends:

```
Messages

+

Available Tools

↓

Provider
```

The Provider converts Agni internal types into provider-specific format.

Example:

Gemini:

```
Agni Tool Definition

↓

Gemini Function Declaration
```

---

## Step 3 — Model Requests Tool

The model decides a tool is required.

Provider returns normalized:

```ts
{
 type:"tool_call",

 name:"get_weather",

 arguments:{
   city:"Pune"
 }
}
```

Important:

Runtime never receives:

```ts
Gemini FunctionCall
```

or:

```ts
OpenAI ToolCall
```

Only Agni internal types.

---

# Step 4 — Runtime Receives Tool Call

Runtime checks:

```
Is this a tool request?

        |
        |
       Yes

        ↓

Execute Tool Flow
```

---

# Step 5 — Tool Lookup

Runtime asks:

```ts
registry.get('get_weather');
```

Flow:

```
Runtime

↓

Tool Registry

↓

Find Tool

↓

Weather Tool
```

---

# Step 6 — Validate Arguments

Before execution:

Input:

```json
{
  "city": "Pune"
}
```

Runtime validates against tool schema.

Example:

Schema:

```ts
{
  city: string;
}
```

Valid:

```json
{
  "city": "Pune"
}
```

Invalid:

```json
{
  "temperature": 30
}
```

---

# Step 7 — Execute Tool

Runtime calls:

```ts
tool.execute(input, context);
```

Example:

```ts
await weatherTool.execute(
  {
    city: 'Pune',
  },
  runContext,
);
```

The Tool performs business logic.

Example:

```
Tool

↓

Weather API

↓

Response
```

---

# Step 8 — Receive Tool Result

Tool returns normal application data.

Example:

```json
{
  "city": "Pune",
  "temperature": "28°C",
  "condition": "Sunny"
}
```

The Tool does not know about providers.

---

# Step 9 — Normalize Tool Result

Runtime converts:

```
Tool Result

↓

Agni Internal Tool Result

↓

Provider Format
```

Example:

Agni:

```ts
{
 type:"tool_result",

 name:"get_weather",

 result:{
  temperature:"28°C"
 }
}
```

Gemini:

```ts
{
 functionResponse:{
   name:"get_weather",
   response:{}
 }
}
```

---

# Step 10 — Continue Agent Loop

The Runtime sends the tool result back.

Flow:

```
Runtime

↓

Provider

↓

Model

↓

Final Answer
```

The model now has the information required to answer.

---

# Sequence Diagram

```
User

 |
 |
 | run()
 |
 ↓

Runtime

 |
 |
 | generate()
 |
 ↓

Provider

 |
 |
 | tool_call
 |
 ↓

Runtime

 |
 |
 | lookup(name)
 |
 ↓

Tool Registry

 |
 |
 | return Tool
 |
 ↓

Tool

 |
 |
 | execute(input,context)
 |
 ↓

External System

 |
 |
 | result
 |
 ↓

Runtime

 |
 |
 | continue()
 |
 ↓

Provider

 |
 |
 | final response
 |
 ↓

User
```

---

# Multiple Tool Execution

A single Agent turn may require multiple tools.

Example:

```
User

↓

Model

↓

Weather Tool

↓

Model

↓

Calendar Tool

↓

Model

↓

Final Answer
```

The Runtime loop handles this naturally.

---

# Parallel Tool Calls

Future providers may return:

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

The Runtime may execute:

Sequential:

```
Tool A

↓

Tool B
```

or parallel:

```
Tool A
    \
     ↓
   Runtime
     ↑
    /
Tool B
```

Decision:

Parallel execution requires explicit safety rules.

Initial version:

Sequential execution.

---

# Tool Execution Errors

Tools can fail.

Example:

```ts
throw new Error('Weather API unavailable');
```

Flow:

```
Tool

↓

Runtime

↓

Error Policy

↓

Recovery
```

Possible recovery:

## Retry

```
Tool Failure

↓

Retry

↓

Success
```

---

## Send Error To Model

```
Tool Failure

↓

Tool Result

{
 error:"API unavailable"
}

↓

Model Recovery
```

---

## Stop Run

```
Tool Failure

↓

RunResult Failure
```

---

# Security Boundary

Tool execution is the point where AI decisions interact with external systems.

Therefore:

```
Model

X

Direct Access

↓

Tool Boundary

↓

Application
```

The model never directly:

- Executes code.
- Accesses databases.
- Calls APIs.

Only approved Tools can do this.

---

# Observability Hooks

Tool execution creates important events.

Example:

```
tool.called

tool.started

tool.completed

tool.failed
```

These events are consumed by the Observability system.

---

# Performance Considerations

Tool execution may become expensive.

Future support:

- Timeout limits.
- Cancellation.
- Retries.
- Rate limiting.
- Caching.

These policies belong to Runtime, not Tools.

---

# Alternatives Considered

## Tool Executes Itself When Model Requests

Rejected.

Reason:

- Tool should not know model lifecycle.
- Security risk.
- Poor control.

---

## Provider Executes Tools

Rejected.

Reason:

- Provider should only communicate with models.
- Application tools are outside model providers.

---

## Runtime Directly Imports Tools

Rejected.

Example:

```ts
runtime.weatherTool();
```

Reason:

- Tight coupling.
- No extensibility.

---

# Final Decision

Agni SDK uses the following execution architecture:

```
Provider

↓

Runtime

↓

Tool Registry

↓

Tool

↓

External System

↓

Tool Result

↓

Runtime

↓

Provider
```

The Runtime owns orchestration.

The Registry owns discovery.

The Tool owns execution logic.

The Provider owns model communication.

This separation enables safe, extensible, and provider-independent tool execution.
