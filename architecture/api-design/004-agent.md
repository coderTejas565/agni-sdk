# 004 — Agent

**Status:** Draft  
**Phase:** API Design  
**Component:** Core API  
**Owner:** Agni SDK

---

# Overview

Agent is the primary configuration object in Agni SDK.

An Agent represents the definition of an AI system.

It contains:

- Model configuration.
- Instructions.
- Available tools.
- Runtime capabilities.
- Optional extensions.

An Agent does not execute tasks directly.

Execution happens through the Runtime using `run()`.

---

# Design Decision

Agent is an immutable configuration object.

It describes **what the agent is**, not **what the agent is currently doing**.

---

# Core Mental Model

```
Agent

=

Identity

+

Capabilities

+

Instructions

+

Model

```

---

Runtime:

```
Agent

+

Input

+

RunContext

        |

        ↓

Execution
```

---

# Why Agent Is Separate From Runtime

A single Agent can execute multiple independent runs.

Example:

```
Customer Support Agent


        |

        +------ Customer A Request

        |

        +------ Customer B Request

        |

        +------ Customer C Request

```

The Agent configuration remains unchanged.

---

# Basic Usage

Example:

```ts
const supportAgent = new Agent({
  model: gemini('gemini-2.5-flash'),

  instructions: 'You are a helpful customer support assistant.',
});
```

---

Execution:

```ts
const result = await run(
  supportAgent,

  'Help me reset my password',
);
```

---

# Agent Configuration

An Agent contains:

```ts
interface AgentOptions<TContext> {
  model: Model;

  instructions: string;

  tools?: Tool<TContext>[];

  guardrails?: Guardrail<TContext>[];

  memory?: Memory<TContext>;
}
```

---

# Model

## Purpose

Defines which AI model powers the Agent.

Example:

```ts
model: gemini('gemini-2.5-flash');
```

---

The Agent does not know provider details.

It only depends on the Agni model interface.

---

Architecture:

```
Agent

↓

Model Interface

↓

Provider Adapter

↓

Gemini/OpenAI/Anthropic

```

---

# Instructions

## Purpose

Defines agent behavior.

Example:

```ts
instructions: 'You are a senior coding assistant.';
```

---

Instructions are static.

Dynamic request data should use:

```
RunContext
```

not string interpolation.

---

Avoid:

```ts
instructions: 'User id is 123';
```

---

Prefer:

```ts
context: {
  userId: '123';
}
```

---

# Tools

Tools define agent capabilities.

Example:

```ts
const agent = new Agent({
  tools: [weatherTool],
});
```

---

Tools allow the model to perform actions.

Examples:

- Database lookup.
- API calls.
- File operations.
- Calculations.

---

Agent stores tool definitions.

Runtime manages execution.

---

Flow:

```
Agent

↓

Tools

↓

Runtime Tool Registry

↓

Tool Execution

```

---

# Guardrails

Guardrails define safety and validation rules.

Example:

```ts
new Agent({
  guardrails: [contentFilter],
});
```

---

Possible guardrails:

- Input validation.
- Output filtering.
- Permission checks.

---

# Memory

Memory provides optional persistence.

Example:

```ts
new Agent({
  memory: userMemory,
});
```

---

Memory is optional.

Default:

```
No Memory
```

---

# Immutability

## Decision

Agents cannot be modified after creation.

---

Avoid:

```ts
agent.tools.push(tool);
```

---

Reason:

- Predictable behavior.
- Easier debugging.
- Safe reuse.
- Better caching.

---

# Agent Clone

Immutability should not reduce flexibility.

Agni supports cloning.

Example:

```ts
const fastAgent = agent.clone({
  model: fastModel,
});
```

---

Result:

```
Original Agent

        |

        +---- Clone Agent

```

---

Original:

unchanged.

Clone:

new configuration.

---

# Clone Use Cases

## Testing

```ts
const testAgent = agent.clone({
  model: testModel,
});
```

---

## Temporary Overrides

Example:

Production:

```ts
temperature: 0.7;
```

Testing:

```ts
temperature: 0;
```

---

# Agent Generic Context

Agent supports typed Run Context.

Example:

```ts
interface AppContext {
  userId: string;

  organizationId: string;
}
```

---

Agent:

```ts
const agent = new Agent<AppContext>({
  model,
  tools,
});
```

---

This type flows into:

- Tools.
- Guardrails.
- Memory.

---

# Agent Does Not Own

Agent should not contain:

```
Runtime State

Messages

Current Tool Calls

Execution History

Temporary Variables

```

---

Those belong to:

```
Run
```

---

# Internal Representation

Conceptually:

```
Agent

{

 id

 model

 instructions

 tools

 guardrails

 memory

}

```

---

Runtime creates:

```
Run Instance

{

 runId

 messages

 context

 state

 events

}

```

---

# API Design Goals

Agent API should feel:

## Simple

```ts
new Agent({
  model,
});
```

---

## Extendable

```ts
new Agent({
  model,

  tools,

  memory,

  guardrails,
});
```

---

## Type Safe

```ts
Agent<MyContext>;
```

---

# Final API Contract

Minimal:

```ts
const agent = new Agent({
  model,

  instructions,
});
```

---

Advanced:

```ts
const agent = new Agent<AppContext>({
  model,

  instructions,

  tools,

  guardrails,

  memory,
});
```

---

Execution:

```ts
run(
  agent,

  input,

  {
    context,
  },
);
```

---

# Final Decision

Agent is the immutable definition of an AI system.

It contains configuration and capabilities.

It does not execute.

Execution belongs to Runtime.

The separation between Agent and Run is the foundation of Agni's API design.
