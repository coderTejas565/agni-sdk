# 005 — Tool

**Status:** Draft  
**Phase:** API Design  
**Component:** Tool API  
**Owner:** Agni SDK

---

# Overview

Tools are capabilities that allow an Agent to interact with the outside world.

An LLM can reason and generate responses, but it cannot directly:

- Access databases.
- Call external APIs.
- Read files.
- Perform application actions.

Tools bridge the gap between model reasoning and real-world execution.

---

# Design Decision

A Tool is a user-defined capability with:

- Identity.
- Description.
- Input schema.
- Execution function.

The Runtime manages execution.

The model only decides **when** to call a tool.

---

# Core Mental Model

```
Tool

=

Description

+

Input Schema

+

Execution Logic

```

---

# Basic Example

```ts
const weatherTool = new Tool({
  name: 'get_weather',

  description: 'Get weather information for a city.',

  parameters: {
    city: 'string',
  },

  execute: async ({ city }) => {
    return getWeather(city);
  },
});
```

---

# Tool Lifecycle

```
Agent

↓

Model decides tool call

↓

Runtime receives request

↓

Tool Registry finds tool

↓

Tool executes

↓

Result returned to model

```

---

# Why Tools Are Separate Objects

Without a tool abstraction:

```ts
if (toolName === 'weather') {
  callWeatherAPI();
}
```

Problems:

- Hardcoded capabilities.
- No extensibility.
- No validation.
- Provider-specific logic leaks.

---

With Tools:

```
Agent

tools:[

 weatherTool,

 searchTool,

 databaseTool

]

```

The Runtime does not care what the tool does.

---

# Tool Interface

Conceptual API:

```ts
interface Tool<TInput, TContext, TOutput> {
  name: string;

  description: string;

  parameters: Schema;

  execute(
    input: TInput,

    context: RunContext<TContext>,
  ): Promise<TOutput> | TOutput;
}
```

---

# Tool Name

## Purpose

Unique identifier used by the model and runtime.

Example:

```ts
name: 'get_weather';
```

---

Requirements:

- Must be unique within an Agent.
- Should describe the action.
- Should remain stable.

---

Good:

```
search_documents
get_user_profile
create_invoice
```

---

Bad:

```
tool1
functionA
doThing
```

---

# Description

The description helps the model understand when to use the tool.

Example:

```ts
description: 'Search company documents for relevant information.';
```

---

Important:

The description is part of the model prompt.

Poor descriptions lead to incorrect tool usage.

---

# Parameters Schema

Tools require structured input definitions.

Example:

```ts
parameters: {
  city: {
    type: 'string';
  }
}
```

---

The schema is used for:

- Model tool selection.
- Input validation.
- Documentation generation.

---

# Tool Execution

The execute function contains actual application logic.

Example:

```ts
execute: async (input, context) => {
  return database.users.find({
    id: context.context.userId,
  });
};
```

---

The Runtime controls:

- When execution happens.
- How errors are handled.
- How results are returned.

---

# Tool Context

Tools receive Run Context.

Example:

```ts
execute(
  input,

  ctx,
);
```

---

Context provides:

- User information.
- Authentication.
- Database clients.
- Request metadata.

---

Example:

```ts
interface AppContext {
  userId: string;

  db: Database;
}
```

---

Tool:

```ts
execute(
 input,

 ctx
){

 return ctx.context.db.orders.find();

}
```

---

# Tool Input Validation

Tool inputs should be validated before execution.

Flow:

```
Model Arguments

↓

Schema Validation

↓

Execute Function

```

---

Invalid input:

```ts
{
  city: 123;
}
```

should not reach:

```ts
execute();
```

---

# Tool Output

Tools can return any serializable value.

Examples:

String:

```ts
'Weather is sunny';
```

---

Object:

```ts
{
  temperature: '28°C';
}
```

---

Array:

```ts
[document1, document2];
```

---

The Provider Adapter converts results into provider-specific formats.

---

# Tool Errors

Tools can fail.

Example:

```ts
execute(){

 throw new Error(
  "API unavailable"
 );

}
```

---

The Runtime handles failures.

Possible strategies:

- Return error to model.
- Retry execution.
- Stop run.

---

Tool errors should not be handled inside the tool.

---

# Sync And Async Tools

Tools support both.

Sync:

```ts
execute(){

 return value;

}
```

---

Async:

```ts
async execute(){

 return await apiCall();

}
```

---

Runtime always awaits execution.

---

# Tool Composition

Tools are reusable.

Example:

```ts
const searchTool = createSearchTool();

const supportAgent = new Agent({
  tools: [searchTool],
});
```

---

The same tool can be attached to multiple agents.

---

# Tool Security

Tools are application code.

They can perform dangerous operations.

Examples:

- Delete database records.
- Send emails.
- Make payments.

---

Future support:

- Permission checks.
- Approval workflows.
- Human confirmation.

---

# Tool Approval Flow

Future architecture:

```
Model

↓

Tool Request

↓

Approval Check

↓

Tool Execution

↓

Result

```

---

# Tool Metadata

Future extension:

```ts
{
  (name, description, permissions, timeout, retryPolicy);
}
```

---

# Tool Does Not Own

Tools should not manage:

```
Agent State

Conversation History

Provider Calls

Runtime Loop

```

---

Tools only perform actions.

---

# Final API Contract

Minimal:

```ts
const tool = new Tool({
  name,

  description,

  parameters,

  execute,
});
```

---

Advanced:

```ts
Tool<Input, Context, Output>;
```

---

# Final Decision

Tools are isolated capabilities attached to Agents.

They expose a clear contract:

- What they do.
- What input they accept.
- How they execute.

The Runtime owns orchestration.

The Provider owns communication.

The Tool owns only its action logic.

This separation allows Agni SDK to support scalable tool ecosystems.
