# Provider Lifecycle — State Machine

**Project:** Agni SDK
**Component:** Provider Layer
**State Machine:** Provider Request Lifecycle
**Version:** 1.0
**Status:** Design Approved (Pre-Implementation)

---

# 1. Purpose

This document defines the lifecycle states of a Provider request inside Agni SDK.

The Provider Layer is responsible for communicating with external AI model providers.

The state machine defines:

- request processing states,
- valid transitions,
- failure paths,
- streaming behavior.

The Provider lifecycle represents a single model communication operation.

---

# 2. Provider Request Concept

A Provider Request represents one communication attempt with an AI model.

Example:

```text
Runtime Request

↓

Provider Request

↓

External Model Call

↓

Provider Response
```

A Provider Request contains:

- model information,
- messages,
- tools,
- generation options,
- execution metadata.

---

# 3. State Machine Overview

```text
                    IDLE

                      |

                      v

              REQUEST_RECEIVED

                      |

                      v

             VALIDATING_REQUEST

                      |

                      v

             TRANSLATING_REQUEST

                      |

                      v

              CALLING_PROVIDER

                      |

                      v

             WAITING_FOR_RESPONSE

                      |

                      v

            PROCESSING_RESPONSE

                 /             \

                /               \

               v                 v

          COMPLETED            FAILED
```

---

# 4. State Definitions

---

# IDLE

## Purpose

Initial state where the Provider is waiting for a request.

The Provider has no active model communication.

---

## State Characteristics

- No active request.
- No external API call.
- No response processing.

---

## Allowed Transition

```text
IDLE

↓

REQUEST_RECEIVED
```

---

# REQUEST_RECEIVED

## Purpose

A request has arrived from the Runtime.

The Provider receives:

- normalized Agni request,
- selected model,
- execution options.

---

## Example

```text
Runtime

↓

Provider.generate(request)
```

---

## Allowed Transitions

Success:

```text
REQUEST_RECEIVED

↓

VALIDATING_REQUEST
```

Failure:

```text
REQUEST_RECEIVED

↓

FAILED
```

---

# VALIDATING_REQUEST

## Purpose

The Provider verifies that the request can be processed.

Validation includes:

- required fields exist,
- supported model,
- supported capabilities,
- valid configuration.

---

## Example Failures

- Missing model.
- Invalid configuration.
- Unsupported feature.

---

## Allowed Transitions

Success:

```text
VALIDATING_REQUEST

↓

TRANSLATING_REQUEST
```

Failure:

```text
VALIDATING_REQUEST

↓

FAILED
```

---

# TRANSLATING_REQUEST

## Purpose

Convert Agni SDK format into provider-specific format.

Example:

```text
Agni Request

↓

OpenAI Request
```

or:

```text
Agni Request

↓

Claude Request
```

---

## Responsibility

The adapter performs translation.

The Provider lifecycle controls when translation happens.

---

## Allowed Transition

```text
TRANSLATING_REQUEST

↓

CALLING_PROVIDER
```

---

# CALLING_PROVIDER

## Purpose

Send the translated request to the external AI provider.

Example:

```text
Provider Adapter

↓

OpenAI API
```

---

## State Characteristics

At this point:

- network communication starts,
- external dependency is involved.

---

## Allowed Transition

```text
CALLING_PROVIDER

↓

WAITING_FOR_RESPONSE
```

---

# WAITING_FOR_RESPONSE

## Purpose

Waiting for the external model response.

Possible events:

- response received,
- timeout,
- network failure,
- provider unavailable.

---

## Allowed Transitions

Success:

```text
WAITING_FOR_RESPONSE

↓

PROCESSING_RESPONSE
```

Failure:

```text
WAITING_FOR_RESPONSE

↓

FAILED
```

---

# PROCESSING_RESPONSE

## Purpose

Convert the provider response into Agni's normalized format.

Example:

```text
OpenAI Response

↓

Agni Response
```

---

## Processing Includes

- response parsing,
- tool call extraction,
- usage extraction,
- finish reason extraction.

---

## Allowed Transitions

Success:

```text
PROCESSING_RESPONSE

↓

COMPLETED
```

Failure:

```text
PROCESSING_RESPONSE

↓

FAILED
```

---

# COMPLETED

## Purpose

The Provider request finished successfully.

The Runtime receives:

- generated content,
- tool calls,
- metadata,
- usage information.

---

## Terminal State

No further transitions.

---

# FAILED

## Purpose

The Provider request could not complete successfully.

Possible reasons:

- authentication failure,
- invalid request,
- timeout,
- network error,
- invalid provider response,
- unsupported capability.

---

## Terminal State

The Runtime Failure Manager decides the next action.

Possible actions:

- retry,
- fallback,
- terminate execution.

---

# 5. Streaming State Flow

Streaming has a slightly different lifecycle.

```text
REQUEST_RECEIVED

↓

VALIDATING_REQUEST

↓

TRANSLATING_REQUEST

↓

START_STREAM

↓

RECEIVING_CHUNKS

↓

EMITTING_EVENTS

↓

STREAM_COMPLETED
```

---

# Streaming States

## START_STREAM

Provider opens a streaming connection.

---

## RECEIVING_CHUNKS

Provider receives partial model output.

Example:

```text
Chunk 1

↓

Chunk 2

↓

Chunk 3
```

---

## EMITTING_EVENTS

Chunks are converted into Agni events.

Example:

```text
TEXT_DELTA

TOOL_DELTA

STREAM_END
```

---

## STREAM_COMPLETED

Streaming finished successfully.

---

# 6. Invalid Transitions

The Provider must reject invalid state changes.

Example:

Invalid:

```text
COMPLETED

↓

CALLING_PROVIDER
```

A completed request cannot continue.

---

Invalid:

```text
FAILED

↓

PROCESSING_RESPONSE
```

Failed requests cannot process responses.

---

# 7. Failure Paths

---

# Authentication Failure

Flow:

```text
CALLING_PROVIDER

↓

External API

↓

Invalid Credentials

↓

FAILED
```

---

# Timeout Failure

Flow:

```text
WAITING_FOR_RESPONSE

↓

Timeout

↓

FAILED
```

---

# Invalid Response

Flow:

```text
PROCESSING_RESPONSE

↓

Parsing Error

↓

FAILED
```

---

# Unsupported Capability

Example:

A model does not support requested feature.

Flow:

```text
VALIDATING_REQUEST

↓

Capability Missing

↓

FAILED
```

---

# 8. State Ownership Rules

## Rule 1

Provider controls communication states.

---

## Rule 2

Runtime controls execution states.

Example:

Provider:

```text
CALLING_PROVIDER
```

Runtime:

```text
EXECUTING_AGENT_LOOP
```

---

## Rule 3

Provider does not decide recovery.

Example:

Provider failure:

```text
FAILED
```

Runtime decides:

```text
Retry?

Fallback?

Stop?
```

---

# 9. Design Principles

## Explicit Lifecycle

Provider communication behavior is predictable.

---

## Clear Responsibility Boundary

Provider manages communication.

Runtime manages orchestration.

---

## Failure First Design

Errors are modeled as normal states.

---

## Isolation

Provider failures should not corrupt Runtime state.

---

## Extensibility

New providers can implement the same lifecycle.

---

# 10. Summary

The Provider Lifecycle defines how Agni SDK communicates with external AI models.

The lifecycle is:

```text
IDLE

↓

REQUEST_RECEIVED

↓

VALIDATE

↓

TRANSLATE

↓

CALL MODEL

↓

PROCESS RESPONSE

↓

COMPLETED
```

or:

```text
ANY ACTIVE STATE

↓

FAILED
```

By modeling Provider communication as an explicit state machine, Agni SDK maintains predictable behavior, clean failure handling, and a stable abstraction across different AI providers.
