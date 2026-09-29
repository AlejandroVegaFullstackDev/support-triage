# CLAUDE.md

This file defines how Claude Code (or any AI coding agent) must behave in this repository.
A human reviews and approves every change; the agent proposes, the human decides.

## Repository map

- `services/tickets-api/`: NestJS (TypeScript, ESM) ticket API. Owns PostgreSQL. Publishes `ticket.created`.
- `services/triage-agent/`: FastAPI (Python 3.12) service. Consumes `ticket.created`, classifies the ticket through an `LLMProvider`, publishes `ticket.triaged`.
- `services/web/`: React + Vite panel. Talks only to `tickets-api` over HTTP.
- `scripts/smoke-test.sh`: end-to-end check against the running stack (also runs in CI).
- `docs/adr/`: architecture decision records. Read them before changing the flow between services.
- `docker-compose.yml`: local stack (PostgreSQL, RabbitMQ, both services).
- `.github/workflows/ci.yml`: lint, type check, tests and image builds on every push.

Services communicate only through HTTP contracts and RabbitMQ events. Never import code across services.

## Objective

Priorities, in order:

1. Security by design
2. Maintainability
3. Simplicity
4. Scalability
5. Consistency with the existing architecture

Principles: KISS, DRY, SOLID, YAGNI, 12-Factor App, Clean Architecture, light DDD where it adds real value.

Prefer the smallest safe change that solves the task correctly.

## Mandatory working rules

- Read relevant files before proposing or editing code.
- Explain the intended change briefly before applying it.
- Keep changes small, localized, and reversible.
- Do not introduce new dependencies unless strictly necessary.
- Do not rewrite unrelated modules.
- Do not hardcode business values, credentials, secrets, endpoints, tokens, or configuration.
- Shared constants live in `utils/` or `config/` depending on purpose.
- Do not add unnecessary comments, noisy loggers, or decorative code.
- Do not leave debug prints, temporary code, or dead branches.
- Preserve backward compatibility of HTTP contracts and event payloads unless the task requires a breaking change.

## triage-agent (Python / FastAPI)

- `app/routers/`: endpoints only. Input extraction and delegation, no business rules.
- `app/controllers/`: classes that orchestrate use cases. Dependencies through `__init__`.
- `app/services/`: abstract contracts (e.g. `LLMProvider`) and domain operations.
- `app/implements/`: concrete implementations (`LocalProvider`, `AnthropicProvider`, `OpenAIProvider`). Only when an abstraction has more than one meaningful implementation.
- `app/dtos/`: Pydantic request/response and event contracts. Explicit and minimal.
- `app/config/`: single `AppConfig` entry point loaded from environment.
- `app/utils/`: pure helpers and shared constants only.
- `tests/`: unit and contract tests. Tests must never call a real LLM; use `LocalProvider` or a fake.

## tickets-api (TypeScript / NestJS)

- One Nest module per bounded area (`tickets/`, `health/`, `messaging/`).
- Controllers: HTTP only. Services: business rules. Repositories: persistence.
- Validate every request body with DTO classes; reject unknown fields.
- Dependency injection through constructors only; no service locators or module-level singletons.
- ESM: relative imports end in `.js`.
- Tests use `node:test` + `supertest`, compiled with `tsc`. Replace the repository and event bus with the fakes in `test/fakes.ts`; tests never need PostgreSQL or RabbitMQ.

## web (React / Vite)

- Components render; data access lives in `src/api.ts` and `src/useTickets.ts`.
- Colors and fonts come from the CSS custom properties in `src/styles.css`. Do not hardcode new colors.
- User-facing copy is Spanish, sentence case, and says what happens ("Enviar a la cola", not "Submit").
- Respect `prefers-reduced-motion` and keep visible keyboard focus.

## LLM provider rules

- The provider is chosen from configuration at the composition boundary: `ANTHROPIC_API_KEY` → Anthropic, else `OPENAI_API_KEY` → OpenAI, else `LocalProvider`.
- Business code depends only on the `LLMProvider` contract.
- LLM output is untrusted input: validate it against a DTO before using it. On invalid output, fall back to `LocalProvider` and record the fallback.
- Never send secrets or unnecessary personal data in prompts. Never log prompts that contain customer text.

## Security rules

- Validate all external input, including queue messages and LLM output.
- Reject malformed or unexpected data early.
- Least privilege for credentials and integrations.
- Restrict CORS to explicit origins.
- Do not expose stack traces or internal error details in API responses.
- Protect sensitive fields from accidental serialization.
- Never use string interpolation for queries, commands, or sensitive operations.
- Prefer idempotent message handlers: processing the same event twice must not duplicate effects.

## Error handling rules

Preferred exception types: `ValidationError`, `BusinessRuleError`, `ExternalServiceError`, `DatabaseTransactionError`, `AuthorizationError`, `AuthenticationError`, `NotFoundError`.

- Raise specific exceptions with clear messages.
- No broad catch-all unless rethrowing or translating at a safe boundary.
- Handle exceptions centrally; API responses must be sanitized, structured, and consistent.
- Writes must be transactional and roll back on failure. Keep transactions short.

## Database rules

- All persistence through the ORM; no raw SQL unless explicitly requested and justified.
- Schema changes only through TypeORM migrations in `src/database/migrations/` (DDL there is the one place SQL is expected). Never enable `synchronize`.
- Commit only after all validations pass.
- Avoid N+1 queries.
- Keep persistence out of controllers and routers.

## Logging and comments

- Log only when it adds operational value. Never log secrets, tokens, or customer text.
- Comments only for non-obvious intent, security constraints, or architectural decisions.

## Validation and delivery

After making changes, always:

1. Summarize what changed
2. List touched files
3. State assumptions or risks
4. Describe validation performed (smallest relevant check first)
5. Mention what could not be verified

## Preferred mindset

simpler over clever · explicit over magical · secure over convenient · maintainable over overengineered · minimal over speculative
