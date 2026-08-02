# 002 — Tool Registration Flow

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Tool System  
**Owner:** Agni SDK

---

# Overview

Tool Registration is the process of converting tools defined in an Agent configuration into an execution-ready Tool Registry.

Users provide tools when creating an Agent:

```ts
const agent = new Agent({
  name: 'Assistant',

  tools: [weatherTool, calculatorTool],
});
```

The Runtime is responsible for registering these tools before execution begins.

---

# Design Goal

The registration flow should provide:

- Explicit tool ownership.
- Execution isolation.
- Fast tool lookup.
- Validation before execution.
- No global state.

---

# High-Level Flow

```
User

↓

Create Agent

↓

Agent stores tools

↓

run(agent,input)

↓

Runtime initializes execution

↓

Create Tool Registry

↓

Register Agent tools

↓

Validate tools

↓

Start agent loop

```

---

# Complete Sequence

```
Application

    |

    |

new Agent({
    tools:[weatherTool]
})

    |

    ↓

Agent Instance

    |

    |

run(agent,input)

    |

    ↓

Runtime

    |

    |

create ToolRegistry()

    |

    ↓

Tool Registry

    |

    |

register(weatherTool)

    |

    ↓

Validation

    |

    |

Registry Ready

    |

    ↓

Agent Execution Begins
```

---

# Step 1 — User Defines Tools

The application developer creates an Agent.

Example:

```ts
const agent = new Agent({
  name: 'Weather Assistant',

  model: gemini(),

  tools: [weatherTool],
});
```

At this stage:

- Tools are configuration.
- No execution happens.
- No registry exists.

Internal state:

```ts
Agent {

 tools:[
   weatherTool
 ]

}
```

---

# Step 2 — Run Starts

User calls:

```ts
await run(agent, 'Weather in Pune?');
```

The Runtime receives:

```ts
{
  (agent, input);
}
```

The Runtime starts a new execution.

---

# Step 3 — Create Execution Scope

The Runtime creates execution-specific resources.

Example:

```
Run Instance

├── RunContext
├── ToolRegistry
├── Memory Context
└── Trace Context
```

Important:

Every run gets its own registry.

---

# Why Execution Scoped?

Incorrect:

```
Global Registry

    |
    |
All Agents
```

Problems:

- Tool leakage.
- State sharing.
- Testing difficulty.

Correct:

```
Agent A

↓

Registry A


Agent B

↓

Registry B
```

Each execution is isolated.

---

# Step 4 — Register Tools

Runtime reads:

```ts
agent.tools;
```

Example:

```ts
[weatherTool, calculatorTool];
```

Then:

```ts
registry.register(weatherTool);

registry.register(calculatorTool);
```

Result:

```
Tool Registry

{
 "get_weather": weatherTool,

 "calculator": calculatorTool
}
```

---

# Step 5 — Validate Tools

Before execution starts, the Runtime validates every tool.

Checks:

## Tool Name

Must exist:

```ts
{
  name: 'weather';
}
```

Invalid:

```ts
{
  description: 'weather';
}
```

---

## Duplicate Names

Invalid:

```ts
[
  {
    name: 'search',
  },

  {
    name: 'search',
  },
];
```

Result:

```
DuplicateToolError
```

---

## Schema Validation

Tool parameters must contain:

```ts
{
  (name, description, parameters, execute);
}
```

Invalid:

```ts
{
  name: 'weather';
}
```

---

# Step 6 — Registry Becomes Available

After successful registration:

```
Runtime Context

{

 tools: ToolRegistry

}
```

The Runtime can now process model tool calls.

---

# Tool Registration Sequence Diagram

```
Application

    |
    |
    | create Agent(tools)
    |
    ↓

Agent

    |
    |
    | run()
    |
    ↓

Runtime

    |
    |
    | create registry
    |
    ↓

ToolRegistry

    |
    |
    | register(tool)
    |
    ↓

Tool

    |
    |
    | validation
    |
    ↓

Registry Ready

    |
    |
    ↓

Agent Loop Starts
```

---

# Failure Scenarios

## Missing Tool Name

Input:

```ts
{
  description: 'weather';
}
```

Flow:

```
Runtime

↓

Tool Registry

↓

Validation Failed

↓

Agent Initialization Error
```

---

## Duplicate Tool

Input:

```ts
[weatherTool, weatherTool];
```

Flow:

```
Register First Tool

↓

Register Second Tool

↓

Name Conflict

↓

Stop Execution
```

---

## Invalid Tool Schema

Example:

```ts
parameters: null;
```

Flow:

```
Validation

↓

Tool Invalid

↓

Run Failed
```

---

# Runtime Behavior After Failure

Tool registration failure happens before model execution.

Therefore:

No provider call:

```
Runtime

X

Provider

```

No tool execution:

```
Tool

X

execute()
```

The failure should return:

```ts
{
 success:false,

 error:{
   type:"invalid_tool_configuration"
 }
}
```

---

# Design Decisions

## Decision 001 — Registration Happens Per Run

Accepted.

Reason:

- Isolation.
- No shared mutable state.
- Multiple agents can run simultaneously.

---

## Decision 002 — Agent Owns Tool Configuration

Accepted.

Reason:

The Agent represents capabilities.

Example:

```
Agent

=
Instructions

+
Model

+
Tools

+
Policies
```

---

## Decision 003 — Runtime Owns Registry Creation

Accepted.

Reason:

Execution infrastructure belongs to Runtime.

The user should not manage internal lifecycle.

---

# Future Extensions

Possible additions:

- Dynamic tool injection.
- Permission-based registration.
- User-specific tools.
- Remote MCP tools.
- Tool marketplace support.

These should extend registration without changing:

```ts
new Agent({
  tools: [],
});
```

---

# Final Decision

Agni SDK uses the following tool registration architecture:

```
Developer

↓

Agent.tools[]

↓

Runtime

↓

Execution Scoped Tool Registry

↓

Validated Tools

↓

Agent Loop
```

The registration process remains internal, automatic, and isolated per execution.

This keeps the public API simple while allowing the internal tool system to scale.
