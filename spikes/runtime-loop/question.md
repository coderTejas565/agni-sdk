# Runtime Loop Spike — Questions

**Project:** Agni SDK  
**Phase:** Walking Skeleton  
**Purpose:** Validate the Runtime architecture before production implementation.

---

# Goal

The goal of this spike is to verify whether the proposed Agent Runtime architecture can successfully orchestrate:

- User input
- LLM provider communication
- Tool detection
- Tool execution
- Context updates
- Final response generation

This spike is not production implementation.

It exists to validate architectural assumptions.

---

# Runtime Questions

## 1. Can the Runtime own the complete agent execution lifecycle?

Expected flow:
User Input

↓

Runtime

↓

Provider

↓

Tool Decision

↓

Tool Execution

↓

Provider

↓

Final Answer

Validation:

Can Runtime coordinate all steps without performing specialized responsibilities?

---

## 2. Can the Runtime support multiple execution iterations?

Example:
User

↓

LLM

↓

Tool Call

↓

Tool Result

↓

LLM

↓

Tool Call

↓

Tool Result

↓

Final Answer

Question:

Does the loop design support repeated reasoning cycles?

---

## 3. How does Runtime know when execution is complete?

Possible completion signals:

- Text response from model
- No pending tool calls
- Maximum iteration reached
- Failure

---

# Provider Questions

## 4. Can the Provider remain independent from Runtime logic?

The Provider should only:

- Send requests to the model
- Return model responses

It should not:

- Execute tools
- Manage loops
- Store state

---

## 5. What does a real model tool-call response look like?

Need to understand:

- Tool name format
- Arguments format
- Response structure
- Required metadata

---

# Tool Questions

## 6. Can tools be dynamically registered and discovered?

The Runtime should not directly know individual tools.

Expected:

Runtime

↓

Tool Registry

↓

Tool

---

## 7. How should tool failures behave?

Questions:

- Should errors stop execution?
- Should the model receive tool errors?
- Should retries happen?

---

# Architecture Questions

## 8. Are our HLD and LLD assumptions correct?

Validate:

- Runtime as orchestrator
- Provider abstraction
- Tool Registry separation
- Execution state ownership

---

## 9. What changes are required before production implementation?

Capture:

- Missing abstractions
- Incorrect assumptions
- New design requirements
