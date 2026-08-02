# 001 — Tool Registry

**Status:** Draft  
**Phase:** Architecture Design  
**Component:** Tool System  
**Owner:** Agni SDK

---

# Overview

The **Tool Registry** is an internal Runtime component responsible for managing available tools during an Agent execution.

It provides a centralized mechanism for:

- Registering tools.
- Looking up tools by name.
- Validating tool availability.
- Delegating execution to the correct tool.

The Tool Registry is **not part of the public SDK API**.

Users interact with tools through the Agent configuration:

```ts
const agent = new Agent({
  tools: [weatherTool, calculatorTool],
});
```

The Runtime internally creates and manages the Tool Registry.

---

# Design Goal

The Tool Registry exists to separate:

```
Tool Definition

from

Tool Execution
```

The Agent defines available capabilities.

The Runtime decides when capabilities are used.

The Tool Registry connects the two.

---

# Responsibilities

The Tool Registry is responsible for:

## 1. Tool Storage

Maintain available tools for an execution.

Example:

```
Tool Registry

├── get_weather
├── calculator
└── search_database
```

---

## 2. Tool Lookup

When the model requests a tool:

Example:

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Pune"
  }
}
```

The Runtime asks:

```ts
registry.get('get_weather');
```

The registry returns the matching tool.

---

## 3. Tool Validation

Before execution:

The registry verifies:

- Tool exists.
- Tool name is valid.
- Tool contract is satisfied.

Example:

```
Model Request

↓

Tool Registry

↓

Tool Found?

    Yes → Execute

    No → Tool Error
```

---

## 4. Execution Delegation

The registry does not execute business logic.

It only delegates:

```
Runtime

↓

Tool Registry

↓

Tool

↓

execute()
```

---

# Non Responsibilities

The Tool Registry does not:

- Decide when tools run.
- Call the LLM.
- Manage the agent loop.
- Retry failed tools.
- Validate business input.
- Store tool history.

These belong to other components.

---

# Architecture Position

The Tool Registry exists between Runtime and Tools.

```
                 Agent

                   |
                   |
              tools[]

                   |
                   ↓

               Runtime

                   |
                   ↓

            Tool Registry

                   |
                   ↓

                Tool

                   |
                   ↓

             External System
```

---

# Lifecycle

The Tool Registry exists only during execution.

```
Run Started

↓

Create Registry

↓

Register Agent Tools

↓

Runtime Execution

↓

Tool Calls

↓

Tool Execution

↓

Run Completed

↓

Destroy Registry
```

---

# Registration Flow

Example:

Agent:

```ts
const agent = new Agent({
  tools: [weatherTool, calculatorTool],
});
```

Runtime initialization:

```
Agent.tools

↓

Tool Registry

↓

register(weatherTool)

↓

register(calculatorTool)

↓

Ready
```

---

# Lookup Flow

Example:

Model response:

```json
{
  "tool": "calculator"
}
```

Execution:

```
Runtime

↓

registry.get("calculator")

↓

Calculator Tool

↓

execute()
```

---

# Conceptual Interface

The internal implementation may look like:

```ts
interface ToolRegistry {
  register(tool: Tool): void;

  get(name: string): Tool | undefined;

  has(name: string): boolean;

  execute(name: string, input: unknown, context: RunContext): Promise<unknown>;
}
```

This interface is internal.

It should not be exported as the primary SDK API.

---

# Why Internal Only?

Exposing Tool Registry creates unnecessary complexity.

Example public API:

```ts
const registry = new ToolRegistry();

registry.register(tool);

run(agent);
```

Problems:

- More concepts for users.
- Duplicate configuration source.
- Easier to create inconsistent state.

Better:

```ts
const agent = new Agent({
  tools: [tool],
});
```

The Runtime handles registration automatically.

---

# Tool Name Resolution

Tools are identified using unique names.

Example:

```ts
{
  name: 'get_weather';
}
```

Rules:

- Names must be unique within an Agent.
- Names should be stable.
- Names are provider-independent.

Invalid:

```ts
[weatherTool, anotherWeatherTool];
```

Both:

```ts
name: 'weather';
```

---

# Duplicate Tool Handling

If duplicate names exist:

Example:

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

The Runtime should fail during initialization.

Reason:

Silent replacement creates unpredictable behavior.

Expected:

```
Agent Initialization Error

Duplicate tool name: search
```

---

# Error Handling

## Tool Not Found

Example:

```
Model requests:

unknown_tool
```

Registry returns:

```
ToolNotFoundError
```

Runtime decides recovery strategy.

Possible options:

- Inform model.
- Stop execution.
- Return failure result.

---

## Tool Execution Failure

The registry does not decide recovery.

Example:

```
Tool

↓

throws Error

↓

Registry

↓

Runtime
```

Runtime handles:

- Retry.
- Failure result.
- Recovery.

---

# Security Considerations

The Tool Registry creates a boundary between model decisions and application capabilities.

Important rules:

- Only registered tools can execute.
- Tool names must be validated.
- Tool permissions should be checked before execution.

Future versions may add:

- Permission policies.
- User approval.
- Tool access control.

---

# Alternatives Considered

## Runtime Directly Stores Tools

Example:

```ts
runtime.tools.find(...)
```

Pros:

- Simple initially.

Cons:

- Runtime becomes responsible for tool management.
- Harder testing.
- Poor separation.

Decision:

Rejected.

---

## Global Tool Registry

Example:

```ts
globalRegistry.register(tool);
```

Pros:

- Easy discovery.

Cons:

- Hidden state.
- Poor isolation.
- Difficult multi-agent usage.

Decision:

Rejected.

---

## Execution Scoped Registry

Example:

```
Agent

↓

Runtime

↓

Tool Registry

↓

Tools
```

Pros:

- Explicit.
- Isolated.
- Testable.
- Supports multiple agents.

Decision:

Accepted.

---

# Future Extensions

Possible future capabilities:

- Tool permissions.
- Tool groups.
- Dynamic tools.
- Remote tools.
- MCP tool support.
- Tool execution tracing.

These should extend the registry without changing the public Agent API.

---

# Final Decision

Agni SDK uses an **internal execution-scoped Tool Registry**.

The Agent owns tool configuration.

The Runtime creates the registry.

The Registry manages lookup and delegation.

Tools remain isolated business capabilities.

This design keeps the public API simple while providing a scalable internal architecture for production-grade agent execution.
