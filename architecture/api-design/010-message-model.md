# 010 — Message Model

## Status

Accepted

---

# Why

Every provider represents conversations differently.

OpenAI, Gemini, and Anthropic all support:

- User messages
- Assistant messages
- Tool calls
- Tool results

…but they serialize them differently.

If Agni Runtime directly used provider-specific message formats, the Runner would become tightly coupled to every provider.

Instead, Agni defines a single normalized Message Model.

Providers are responsible for translating between the normalized model and their native SDKs.

---

# Goals

The Message Model should:

- Be provider agnostic.
- Represent every stage of an Agent conversation.
- Support future providers.
- Support tool calling.
- Support streaming.
- Support memory.
- Support tracing.
- Never expose provider-specific objects.

---

# Message Lifecycle

```
User
        │
        ▼
UserMessage
        │
        ▼
Provider
        │
        ▼
AssistantMessage
        │
        ▼
ToolCallMessage
        │
        ▼
ToolResultMessage
        │
        ▼
Provider
        │
        ▼
AssistantMessage
```

Every conversation is simply an ordered list of Messages.

---

# Message Types

Agni defines five message types.

## 1. SystemMessage

Represents system instructions.

Example

```ts
{
    role: "system",
    content: "You are a helpful assistant."
}
```

---

## 2. UserMessage

Represents human input.

Example

```ts
{
    role: "user",
    content: "What's the weather in Pune?"
}
```

---

## 3. AssistantMessage

Represents normal model output.

Example

```ts
{
    role: "assistant",
    content: "The weather is sunny."
}
```

---

## 4. ToolCallMessage

Represents a model requesting tool execution.

Example

```ts
{
    role: "assistant",

    toolCall: {
        id: "...",
        name: "get_weather",
        arguments: {
            city: "Pune"
        }
    }
}
```

The Runtime executes the requested tool.

---

## 5. ToolResultMessage

Represents the output of a tool.

Example

```ts
{
    role: "tool",

    toolResult: {
        toolCallId: "...",
        name: "get_weather",
        output: {
            temperature: 30,
            condition: "Sunny"
        }
    }
}
```

The Runtime appends this message before calling the Provider again.

---

# Why ToolCall and ToolResult are Messages

A tool execution is part of the conversation.

It is not an internal Runtime event.

Providers expect tool execution history to appear inside the conversation.

Representing tool execution as Messages ensures:

- conversation history remains complete
- memory can persist tool outputs
- tracing can replay conversations
- streaming remains consistent
- providers receive the same conversation history

---

# Provider Responsibility

Providers convert the normalized Message Model into provider-native formats.

Example

## Gemini

```
ToolResultMessage
↓

functionResponse
```

---

## OpenAI

```
ToolResultMessage
↓

tool message
```

---

## Anthropic

```
ToolResultMessage
↓

tool_result block
```

The Runtime never performs these conversions.

---

# Runtime Responsibility

Runtime only performs orchestration.

Responsibilities include:

- maintaining message history
- executing tools
- appending ToolResultMessages
- calling Providers

Runtime never understands provider-specific message formats.

---

# Future Compatibility

The Message Model is designed to support:

- Streaming
- Memory
- Handoffs
- Multi-Agent execution
- Tracing
- Observability
- Session persistence

without changing the Runner.

---

# Design Principles

The Message Model follows these principles.

## Provider Agnostic

Messages never contain Gemini, OpenAI, or Anthropic SDK types.

---

## Conversation First

Every interaction becomes part of the conversation.

---

## Immutable History

Messages are appended.

Existing messages are never modified.

---

## Runtime Owns History

Providers never mutate conversation state.

---

## Extensible

Future message types may be added without changing existing APIs.

Examples include:

- ImageMessage
- AudioMessage
- FileMessage
- ReasoningMessage

---

# Summary

The Message Model is the canonical conversation format inside Agni.

Runtime orchestrates Messages.

Providers translate Messages.

Tools produce Messages.

Everything communicates through the same normalized representation.
