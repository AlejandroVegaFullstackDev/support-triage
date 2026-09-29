# 2. Pluggable LLM provider with a local fallback

**Status:** accepted

## Context

The agent should work with Claude or OpenAI, but the project must also run with no API key: in CI, on a reviewer's laptop, and when a provider is down.

## Decision

Business code depends on an `LLMProvider` contract with one method, `classify(subject, body) -> TriageDecision`. Three implementations:

| Provider | When it is used |
|---|---|
| `AnthropicProvider` | `ANTHROPIC_API_KEY` is set |
| `OpenAIProvider` | `OPENAI_API_KEY` is set (and no Anthropic key) |
| `LocalProvider` | No key. Deterministic keyword rules. |

The choice happens once, at the composition boundary (`app/config/providers.py`). `TriageController` always receives a `LocalProvider` as fallback: if the primary provider raises `ExternalServiceError` (timeout, API error, refusal, output that fails validation), the ticket is still triaged locally and the event records `provider: "local"`.

LLM output is treated as untrusted input. Both LLM providers use the SDKs' structured-output parsing against the same Pydantic model (`TriageDecision`), so category and priority can only be values the rest of the system knows. The prompt wraps the ticket in `<ticket>` tags and states that its content is data, not instructions.

## Consequences

- Tests and CI never call a paid API and are deterministic.
- Adding a provider is one class plus one branch in the factory.
- The local classifier is intentionally simple; its quality is the floor, not the goal.
- Which provider triaged each ticket is stored and shown in the UI, so fallbacks are visible.
