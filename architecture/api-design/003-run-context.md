# 003 — Run Context

**Status:** Draft  
**Phase:** API Design  
**Component:** Runtime API  
**Owner:** Agni SDK

---

# Overview

Run Context defines how request-specific data flows through the Agni execution lifecycle.

An Agent configuration is static.

A Run is dynamic.

Applications need a way to pass execution-specific information without using:

- Global variables.
- Closures.
- Hidden dependencies.

Run Context provides a typed container for this data.

---

# Design Decision

Agni uses a generic `RunContext<TContext>` model.

The context is created per execution and passed through the entire runtime lifecycle.

---

# Core Concept

```
Agent Configuration

        +

Run Input

        +

Run Context

        |

        ↓

Runtime Execution

        |

        ↓

Tools

Guardrails

Memory

Events

```

---

# Why Run Context Exists

Real applications require request-scoped information.

Examples:

## User Information

```ts
{
  userId: 'user_123';
}
```

---

## Authentication

```ts
{
  token: 'jwt_token';
}
```

---

## Database Access

```ts
{
  db: databaseClient;
}
```

---

## Request Metadata

```ts
{
  requestId: 'req_123';
}
```

---

This data should not become part of:

- Agent instructions.
- Conversation messages.
- Tool arguments.

---

# Problem Without Context

Without Run Context, developers usually create hidden dependencies.

Example:

```ts
let currentUser;

tool.execute(){

 return database.get(
   currentUser.id
 );

}
```

Problems:

- Hard to test.
- Unsafe for concurrent requests.
- Difficult to reuse.

---

# Agni Solution

Explicit context passing.

Example:

```ts
await run(
  agent,

  'Get my orders',

  {
    context: {
      userId: '123',
    },
  },
);
```

---

# Type Definition

```ts
interface RunContext<TContext> {
  context: TContext;

  signal?: AbortSignal;

  runId: string;
}
```

---

# Generic Context

Run Context is generic.

Example:

```ts
interface UserContext {
  userId: string;

  role: string;
}
```

---

Agent:

```ts
Agent<UserContext>;
```

---

Run:

```ts
run<UserContext>(
  agent,

  input,

  {
    context: {
      userId: '123',
      role: 'admin',
    },
  },
);
```

---

# Context Lifecycle

```
Application

      |

      ↓

Create Context

      |

      ↓

run()

      |

      ↓

Runtime

      |

      +------------+

      |            |

      ↓            ↓

   Tools     Guardrails

      |

      ↓

 Provider Execution

```

---

# Context Ownership

## Application Owns

Creating context:

```ts
{
  (userId, db, permissions);
}
```

---

## Agni Owns

Passing context safely through execution.

---

Agni does not:

- Modify context.
- Store context globally.
- Persist context automatically.

---

# Context Immutability

## Decision

Run Context should be treated as immutable.

Example:

```ts
context.userId;
```

should not change during execution.

---

Reason:

- Predictable execution.
- Easier debugging.
- Safe tracing.

---

If mutation is required:

Application should provide a mutable object intentionally.

---

# Tool Context Access

Tools receive context.

Example:

```ts
const orderTool = {
  name: 'get_orders',

  async execute(input, ctx) {
    return ctx.context.db.orders.find();
  },
};
```

---

Tool signature:

```ts
execute(
 input:TInput,

 context:
 RunContext<TContext>

)
```

---

# Guardrail Context Access

Guardrails also receive context.

Example:

```ts
guardrail.check(
  input,

  context,
);
```

---

Possible usage:

- User permissions.
- Organization rules.
- Feature flags.

---

# Memory Context Access

Memory systems may use context.

Example:

```ts
memory.retrieve(
  query,

  context,
);
```

---

Possible usage:

- User scoped memory.
- Tenant isolation.
- Personalization.

---

# Provider Context Access

Providers generally should not depend on application context.

However, provider adapters may use context for:

- Request metadata.
- Logging.
- Custom headers.

---

# Context vs Conversation

Important separation:

```
Context

=
Application State


Conversation

=
Model State

```

---

Context example:

```ts
{
  userId: '123';
}
```

---

Conversation example:

```
User:
Hello

Assistant:
Hi
```

---

They must remain separate.

---

# Cancellation Support

Run Context carries cancellation signals.

Example:

```ts
await run(
  agent,

  input,

  {
    signal: controller.signal,
  },
);
```

---

Runtime passes the signal to:

- Provider calls.
- Tool execution.
- Streaming.

---

# Security Considerations

Context may contain sensitive application data.

Therefore:

Agni should:

- Never expose context to the model automatically.
- Never serialize context into messages.
- Never log context by default.

---

# Testing Benefits

Explicit context improves testing.

Example:

```ts
const result = await run(
  agent,

  input,

  {
    context: {
      userId: 'test',
    },
  },
);
```

---

No:

- Global setup.
- Environment manipulation.
- Mock state.

---

# Final API Contract

Expected usage:

```ts
const result = await run(
  agent,

  'Find my orders',

  {
    context: userContext,
  },
);
```

---

Internal flow:

```
run()

↓

RunContext<T>

↓

Runtime

↓

Tool<T>

↓

Guardrail<T>

↓

Memory<T>

```

---

# Final Decision

Run Context is the official mechanism for passing request-scoped data through Agni.

It provides:

- Type safety.
- Explicit dependencies.
- Better testing.
- Multi-user safety.
- Production scalability.

All runtime extensions should prefer `RunContext<T>` over hidden state.
