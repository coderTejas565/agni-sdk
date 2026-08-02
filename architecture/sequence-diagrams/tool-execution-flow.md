# Tool Execution Flow — Sequence Diagram

**Project:** Agni SDK
**Component:** Tool System
**Diagram:** Tool Invocation and Execution Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document describes the complete lifecycle of a tool execution inside Agni SDK.

The goal is to explain:

- how the LLM requests a tool,
- how Runtime receives the tool call,
- how the Tool System discovers the tool,
- how validation happens,
- how execution occurs,
- how results return back to the model.

This diagram focuses only on tool execution flow.

---

# 2. Tool Execution Overview

The complete flow:

```text
LLM Decision

↓

Runtime Receives Tool Call

↓

Tool Manager

↓

Tool Registry

↓

Tool Executor

↓

Tool Implementation

↓

External System

↓

Result

↓

Runtime

↓

LLM
```

---

# 3. Actors Involved

```text
Developer

    |

    v

Agent Runtime

    |

    v

Provider / LLM

    |

    v

Tool Manager

    |

    v

Tool Registry

    |

    v

Tool Executor

    |

    v

Tool Implementation

    |

    v

External System
```

---

# 4. High-Level Sequence Diagram

```text
                 Runtime

                    |

                    |

              Tool Call Received

                    |

                    v

              Tool Manager

                    |

                    |

             Find Tool By Name

                    |

                    v

              Tool Registry

                    |

                    |

              Tool Metadata

                    |

                    v

              Tool Executor

                    |

                    |

             Validate Input

                    |

                    |

              Execute Tool

                    |

                    v

             Tool Function

                    |

                    |

          External System/API

                    |

                    |

                Tool Result

                    |

                    v

                 Runtime

                    |

                    |

              Send Result To LLM
```

---

# 5. Detailed Execution Flow

---

# Step 1 — LLM Decides Tool Usage

The LLM receives:

- user input,
- instructions,
- available tools.

Example:

User:

```text
"What is the weather in Mumbai?"
```

Available tool:

```text
get_weather
```

The model decides:

```text
Call get_weather

Arguments:

{
 city:"Mumbai"
}
```

---

Important:

The LLM does not execute anything.

It only produces a tool request.

---

# Step 2 — Runtime Receives Tool Call

The Provider returns a response containing:

```text
Tool Call

name:
get_weather

arguments:
{
 city:"Mumbai"
}
```

The Runtime detects:

```text
This is not final output.

A tool execution is required.
```

---

# Step 3 — Runtime Sends Request To Tool Manager

The Runtime delegates execution.

Flow:

```text
Runtime

↓

Tool Manager

execute(
 toolName,
 arguments
)
```

The Runtime does not know:

- where the tool exists,
- how it runs,
- how input is validated.

---

# Step 4 — Tool Manager Queries Registry

Tool Manager asks:

```text
Find:

get_weather
```

The Registry searches registered tools.

Example:

```text
Registry


get_weather

search_database

send_email
```

Result:

```text
Weather Tool Metadata
```

---

# Step 5 — Tool Validation

Before execution, input validation happens.

Example:

Expected:

```json
{
  "city": "string"
}
```

Received:

```json
{
  "city": 123
}
```

Validation fails.

Flow:

```text
Tool Input

↓

Schema Validator

↓

Invalid

↓

Tool Error
```

---

If valid:

```text
Validation Passed

↓

Execute Tool
```

---

# Step 6 — Tool Execution

The Tool Executor invokes the tool implementation.

Example:

```text
Weather Tool

↓

Weather API

↓

Current Weather Data
```

The Tool System controls execution.

The LLM never directly calls external systems.

---

# Step 7 — External System Response

The external system returns data.

Example:

```json
{
  "temperature": 32,
  "condition": "sunny"
}
```

The Tool captures the response.

---

# Step 8 — Result Processing

The Tool Executor creates a structured result.

Example:

```text
Tool Result

{
 success:true,
 data:{
   temperature:32
 }
}
```

or:

```text
Tool Result

{
 success:false,
 error:"API unavailable"
}
```

---

# Step 9 — Runtime Receives Result

The result returns:

```text
Tool

↓

Tool Executor

↓

Tool Manager

↓

Runtime
```

Runtime updates execution state.

---

# Step 10 — Runtime Sends Result Back To Model

The Runtime adds the tool result to the conversation.

Flow:

```text
Runtime

↓

Provider

↓

LLM
```

The model now continues reasoning.

Example:

```text
"The weather in Mumbai is 32°C and sunny."
```

---

# 6. Complete Sequence Diagram

```text
        LLM

         |

         |

     Tool Decision

         |

         v

      Runtime

         |

         |

  Execute Tool Request

         |

         v

   Tool Manager

         |

         |

   Lookup Tool

         |

         v

   Tool Registry

         |

         |

    Tool Metadata

         |

         v

   Tool Executor

         |

         |

 Validate Arguments

         |

         |

 Execute Capability

         |

         v

       Tool

         |

         |

 External System

         |

         |

     Tool Result

         |

         v

      Runtime

         |

         |

    Provider

         |

         |

        LLM
```

---

# 7. Failure Flows

---

# Tool Not Found

Example:

```text
LLM requests:

unknown_tool
```

Flow:

```text
Runtime

↓

Tool Manager

↓

Registry Lookup

↓

Tool Missing

↓

Tool Error
```

The Runtime decides:

- inform model,
- retry,
- stop.

---

# Invalid Input

Flow:

```text
Tool Call

↓

Validation

↓

Schema Error

↓

Runtime
```

---

# External API Failure

Example:

```text
Weather API timeout
```

Flow:

```text
Tool

↓

External API

↓

Failure

↓

Tool Result

↓

Runtime
```

Runtime decides recovery.

---

# 8. Streaming Tool Execution

Some tools may produce incremental output.

Example:

- file processing,
- long-running tasks,
- data analysis.

Flow:

```text
Tool

↓

Partial Results

↓

Tool Events

↓

Runtime

↓

Agent Events
```

---

# 9. Responsibility Boundaries

## LLM

Responsible for:

- deciding tool usage,
- generating arguments.

---

## Runtime

Responsible for:

- coordinating execution,
- maintaining agent flow.

---

## Tool Manager

Responsible for:

- managing tool lifecycle.

---

## Tool Registry

Responsible for:

- finding tools.

---

## Tool Executor

Responsible for:

- validation,
- execution,
- result formatting.

---

## Tool

Responsible for:

- performing capability.

---

# 10. Design Principles

## Controlled Execution

Models never directly execute external actions.

---

## Runtime as Coordinator

Runtime remains the central execution authority.

---

## Contract-Based Tools

Every tool has predictable inputs and outputs.

---

## Failure Isolation

Tool failures do not automatically crash the agent.

---

## Extensibility

New tools can be added without Runtime changes.

---

# Summary

The Tool Execution Flow defines how an AI agent interacts with external capabilities.

The complete lifecycle:

```text
LLM

↓

Tool Call

↓

Runtime

↓

Tool Manager

↓

Registry

↓

Executor

↓

Tool

↓

External System

↓

Result

↓

Runtime

↓

LLM
```

The design keeps reasoning, orchestration, and execution separate.

The LLM decides **what should happen**.

The Runtime coordinates **how it happens**.

The Tool System performs **the actual capability**.
