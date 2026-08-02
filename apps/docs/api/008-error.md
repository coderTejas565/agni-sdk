```md id="73194"
# Errors

**Status:** Public API Documentation  
**Component:** Error Handling API  
**Package:** Agni SDK

---

# Overview

Agent execution involves many components:

- Model providers.
- Tools.
- Guardrails.
- Runtime.
- User-defined code.

Failures can happen at any stage.

Agni provides a structured error system so applications can handle failures predictably.

---

# Error Philosophy

Agni separates failures into two categories:
```

Expected Execution Failures

↓

Returned as Result

Unexpected System Failures

↓

Thrown as Exceptions

````

---

# Why Not Throw Everything?

Some failures are normal parts of agent execution.

Examples:

- A tool is unavailable.
- A guardrail blocks a request.
- The maximum turn limit is reached.
- A provider temporarily fails.

These should not force applications into large `try/catch` blocks.

---

# Example

```ts
const result = await run(
  agent,
  input
);


if (!result.success) {

  console.log(
    result.error.message
  );

}
````

---

# Error Structure

All Agni errors follow a common structure.

Example:

```ts
{
  type: "tool_error",

  message:
    "Weather service unavailable",

  metadata: {

    toolName:
      "get_weather"

  }
}
```

---

# Error Properties

## type

Identifies the error category.

Example:

```ts
type: 'provider_error';
```

---

## message

Human-readable explanation.

Example:

```ts
message: 'Model request failed';
```

---

## metadata

Additional debugging information.

Example:

```ts
metadata: {

 provider:"gemini",

 retryable:true

}
```

---

## cause

Original error when available.

Example:

```ts
cause: originalError;
```

---

# Common Error Types

---

# Provider Error

Occurs when communication with an AI provider fails.

Examples:

- API unavailable.
- Rate limit.
- Timeout.
- Invalid response.

Example:

```ts
{
 type:"provider_error",

 message:
 "Provider request failed",

 metadata:{
   provider:"gemini"
 }
}
```

---

# Tool Error

Occurs when a tool execution fails.

Example:

```ts
{
 type:"tool_error",

 message:
 "Database connection failed",

 metadata:{
   toolName:
    "search_database"
 }
}
```

---

# Validation Error

Occurs when input data does not match expected format.

Examples:

- Invalid tool arguments.
- Invalid configuration.
- Schema mismatch.

Example:

```ts
{
 type:"validation_error",

 message:
 "Expected city as string"
}
```

---

# Guardrail Error

Occurs when a guardrail blocks execution.

Example:

```ts
{
 type:"guardrail_blocked",

 message:
 "Request rejected by policy"
}
```

---

# Max Turns Error

Occurs when an Agent exceeds the allowed execution steps.

Example:

```ts
{
 type:"max_turns_exceeded",

 metadata:{
   maxTurns:10
 }
}
```

---

# Cancellation Error

Occurs when execution is cancelled.

Example:

```ts
{
 type:"cancelled",

 message:
 "Execution stopped"
}
```

---

# Handling Errors From run()

The `run()` function returns a `RunResult`.

Success:

```ts
{
 success:true,

 output:"Response"
}
```

---

Failure:

```ts
{
 success:false,

 error:{
   type:"tool_error",

   message:
   "Tool failed"
 }
}
```

---

# Type-Safe Error Handling

Because errors are typed, applications can handle different cases.

Example:

```ts
if (!result.success) {
  switch (result.error.type) {
    case 'tool_error':
      handleToolFailure();

      break;

    case 'provider_error':
      retryRequest();

      break;

    case 'guardrail_blocked':
      showMessage();

      break;
  }
}
```

---

# Errors In Streaming

Streaming uses the same error model.

Example:

```ts
for await (const event of stream(agent, input)) {
  if (event.type === 'run_error') {
    console.log(event.error);
  }
}
```

---

# Tool Error Handling

Tools should report failures.

Example:

```ts
const paymentTool = {
  execute() {
    throw new Error('Payment failed');
  },
};
```

---

The Runtime decides what happens next:

- Retry.
- Return failure.
- Send error information back to the model.

Tools should not control the Agent loop.

---

# Provider Error Handling

Provider-specific errors are normalized.

Example:

Gemini:

```
429 RESOURCE_EXHAUSTED
```

becomes:

```ts
{
 type:"provider_error",

 metadata:{
   retryable:true
 }
}
```

---

Applications do not need provider-specific error handling.

---

# Retry Information

Errors may include retry metadata.

Example:

```ts
{
 type:"provider_error",

 metadata:{

   retryable:true,

   retryAfter:5000

 }

}
```

---

Applications can decide whether to retry.

---

# Security Considerations

Errors should never expose sensitive information.

Avoid:

```ts
{
  message: 'Failed using API_KEY=xxxx';
}
```

---

Prefer:

```ts
{
  message: 'Authentication failed';
}
```

---

Never expose:

- API keys.
- Tokens.
- Database credentials.
- Private user context.

---

# Unexpected Errors

Some errors indicate programming problems.

Examples:

- Broken SDK state.
- Invalid internal assumptions.
- Framework bugs.

These are thrown.

Example:

```ts
throw new AgniInternalError('Invalid runtime state');
```

---

# Error Flow

Complete execution:

```
User

↓

run()

↓

Runtime

↓

Provider / Tool

↓

Failure

↓

Error Classification

↓

+----------------------+

|                      |

Expected             Unexpected

|                      |

↓                      ↓

RunResult             Throw

Failure               Exception

```

---

# Best Practices

## Always check run result

Good:

```ts
const result = await run(agent, input);

if (!result.success) {
  handle(result.error);
}
```

---

## Do not catch everything

Avoid:

```ts
try {

 await run();

}

catch(){

}
```

unless handling unexpected failures.

---

## Log metadata

Metadata helps debugging.

Example:

```ts
error.metadata;
```

---

# Future Error Types

Future versions may include:

- Memory failure.
- Approval required.
- Handoff failure.
- Budget exceeded.
- Timeout.

---

# Summary

Agni uses structured errors to make Agent failures predictable.

The model is:

```
Expected failures

↓

RunResult / Stream Events


Unexpected failures

↓

Exceptions
```

This provides:

- Better TypeScript support.
- Easier debugging.
- Predictable application behavior.
- Production-ready error handling.

```

```
