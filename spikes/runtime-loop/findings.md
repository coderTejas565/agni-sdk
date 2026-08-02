# Runtime Loop Spike — Findings

**Project:** Agni SDK  
**Phase:** Walking Skeleton  
**Status:** Completed

---

# Summary

The Runtime Loop spike successfully validated the core Agni SDK architecture.

The implementation demonstrated that a Runtime orchestrator can coordinate:

- Gemini provider communication
- Tool discovery
- Tool execution
- Multi-step agent loops
- Final response generation

The goal of this spike was not production implementation but architectural validation before building the complete SDK.

---

# Finding 001 — Runtime Orchestration Works

## Observation

The Runtime successfully controlled the complete execution flow.

Actual flow:

```

User

↓

Runtime

↓

Gemini Provider

↓

Tool Call

↓

Tool Registry

↓

Tool Execution

↓

Runtime

↓

Gemini Provider

↓

Final Answer

```

## Decision

Runtime remains the central execution orchestrator.

Status:

✅ Validated

---

# Finding 002 — Provider Should Not Own Tool Execution

## Observation

Gemini returned tool requests, but the Runtime executed the tools.

The Provider only handled:

- Sending requests
- Receiving responses

The Provider did not:

- Execute tools
- Control loops
- Manage execution state

## Decision

Provider abstraction remains responsible only for model communication.

It must not contain:

- Tool execution logic
- Loop control
- Runtime state

Status:

✅ Validated

---

# Finding 003 — Tool Registry Separation Works

## Observation

Runtime interacted with tools through the registry.

Runtime did not directly import or execute tools.

## Decision

Tool Registry remains an independent component responsible for:

- Tool registration
- Tool lookup
- Tool execution delegation

Status:

✅ Validated

---

# Finding 004 — Agent Execution Is Iterative

## Observation

A single user request resulted in multiple execution cycles.

Example:

```

User

↓

Gemini

↓

Weather Tool (Pune)

↓

Gemini

↓

Weather Tool (Mumbai)

↓

Gemini

↓

Final Answer

```

## Decision

The Runtime must be designed around an execution loop, not a single model request.

Status:

✅ Validated

---

# Finding 005 — Model Responses Must Be Validated

## Observation

Gemini SDK types expose optional fields.

Example:

```ts
functionCall.name?: string
```

The Runtime cannot blindly trust provider responses.

## Decision

Runtime must validate:

- Tool name
- Tool arguments
- Response structure

before execution.

Status:

✅ Added requirement

---

# Finding 006 — Tool Failures Need Runtime Handling

## Observation

When a tool throws an error, execution stops.

Example:

```
Tool Error

↓

Runtime Failure
```

## Decision

Production Runtime needs an explicit error strategy.

Future considerations:

- Retry policies
- Error messages to model
- Recovery strategies
- Failure states

Status:

⚠️ Requires future design

---

# Finding 007 — State Machine Design Is Required

## Observation

The simple loop works, but production features require explicit execution states.

Required states:

```
CREATED

↓

CALLING_PROVIDER

↓

PROCESSING_RESPONSE

↓

EXECUTING_TOOL

↓

UPDATING_CONTEXT

↓

COMPLETED
```

## Decision

Production Runtime should use explicit Run state management.

Status:

⚠️ Required for implementation

---

# Finding 008 — Provider Responses Need Normalization

## Observation

The Runtime currently consumes Gemini-specific response formats.

Examples:

- Gemini `Content`
- Gemini `FunctionCall`
- Gemini `FunctionResponse`

The implementation works, but the Runtime is now coupled to the Gemini SDK structure.

## Problem

Different providers expose different formats.

Example:

Gemini:

```ts
{
  functionCall: {
    (name, args);
  }
}
```

Other providers may return completely different structures.

## Decision

The production SDK should introduce a provider adapter layer.

Provider-specific responses should be converted into Agni internal types before reaching the Runtime.

Expected architecture:

```
Provider SDK

↓

Provider Adapter

↓

Agni Internal Types

↓

Runtime
```

Status:

⚠️ Required before multi-provider support

---

# Finding 009 — Tools Require an Explicit Contract

## Observation

The Tool Registry initially depended on the concrete weather tool implementation.

This would make adding new tools difficult.

## Decision

Tools must follow a common contract containing:

- Tool metadata
- Tool schema
- Execution function

Example:

```
Tool

├── name
├── description
├── parameters
└── execute()
```

The Registry should depend on the Tool interface, not individual tool implementations.

Status:

✅ Validated

---

# Finding 010 — External SDK Types Should Not Leak Into Core Components

## Observation

Using Gemini SDK types directly created tight coupling.

Examples:

- Gemini Schema
- Gemini Content
- Gemini FunctionCall

The Runtime should not understand provider-specific implementation details.

## Decision

The production SDK should maintain internal framework types.

External SDK types should only exist inside provider implementations.

Expected separation:

```
External Provider SDK

↓

Provider Layer

↓

Agni Core Types

↓

Runtime
```

Status:

⚠️ Required architectural improvement

---

# Finding 011 — Tool Results Need Normalization

## Observation

Tools can return arbitrary values.

Example:

```json
{
  "city": "pune",
  "temperature": "28°C"
}
```

However, providers expect specific function response formats.

## Decision

Runtime or Provider Adapter must normalize tool results before sending them back to the model.

Current spike approach:

```json
{
  "output": result
}
```

Production implementation should define a standard internal tool result format.

Status:

⚠️ Required for production

---

# Finding 012 — Walking Skeleton Successfully Validated Core Loop

## Observation

The complete execution lifecycle works:

```
User Input

↓

Runtime

↓

Provider

↓

Tool Call

↓

Tool Execution

↓

Context Update

↓

Provider

↓

Final Response
```

The implementation successfully handled:

- Normal conversations
- Tool execution
- Multiple tool calls
- Tool failures
- Unknown tools

## Decision

The Runtime execution model is approved as the foundation for production implementation.

Status:

✅ Validated

---

# Architecture Changes After Spike

No major architectural changes required.

Validated components:

✅ Runtime
✅ Provider abstraction
✅ Tool Registry
✅ Agent execution loop

Additional requirements discovered:

- Provider response normalization
- Internal Agni type system
- Tool contract definition
- Tool result normalization
- Response validation
- Error handling strategy
- Explicit run state management

---

# Final Conclusion

The walking skeleton confirmed that the Agni SDK architecture is viable.

The spike validated the most important assumption:

> The Runtime can successfully orchestrate an AI agent execution lifecycle without owning specialized responsibilities.

The next phase can focus on designing the public SDK API and implementing production-grade components.

```

```
