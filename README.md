# Support Triage

Event-driven support ticket system. A NestJS API stores tickets and publishes events; a Python agent classifies each ticket (category, priority, suggested reply) with a pluggable LLM provider — Claude, OpenAI, or a local rule-based fallback that needs no API key.

> 🚧 Work in progress. Phase 1 (skeleton, CI, containers) done.

## Architecture

```
React (panel) ──REST──▶ tickets-api (NestJS + PostgreSQL)
                              │ ticket.created
                              ▼
                          RabbitMQ
                              │
                              ▼
                        triage-agent (FastAPI)
                              │ LLMProvider: Anthropic | OpenAI | Local
                              │ ticket.triaged
                              ▼
                        tickets-api updates the ticket
```

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

- tickets-api: http://localhost:3000/health
- triage-agent: http://localhost:8000/health
- RabbitMQ UI: http://localhost:15672 (guest / guest)

## Tests

```bash
cd services/tickets-api && npm ci && npm test
cd services/triage-agent && uv sync && uv run pytest
```

## Roadmap

- [x] Phase 1: skeleton, Docker Compose, CI
- [ ] Phase 2: tickets CRUD + `ticket.created` event
- [ ] Phase 3: triage with local classifier + tests
- [ ] Phase 4: Anthropic and OpenAI providers (auto-selected by available key)
- [ ] Phase 5: React panel
- [ ] Phase 6: architecture decision records

## How this repo is built

Development is AI-assisted under explicit rules: see [CLAUDE.md](CLAUDE.md). The agent proposes; every change is reviewed and approved by a human.
