# 1. Triage runs asynchronously through RabbitMQ

**Status:** accepted

## Context

Classifying a ticket may call an external LLM. That call can take seconds, time out, or be rate limited. Creating a ticket must stay fast and must never fail because the LLM is slow or down.

## Decision

`tickets-api` stores the ticket and publishes `ticket.created` to a topic exchange. `triage-agent` consumes it, classifies the ticket, and publishes `ticket.triaged`, which `tickets-api` consumes to update the row. The panel polls and shows "Clasificando…" meanwhile.

- Durable exchange and queues, persistent messages.
- Each consumer queue has a dead-letter exchange. Invalid payloads go straight to the dead-letter queue; unexpected errors are retried once, then dead-lettered.
- Events carry only what the consumer needs. `ticket.created` does **not** include the customer email.

## Consequences

- Ticket creation latency does not depend on the LLM.
- Either service can be restarted without losing work; messages wait in the queue.
- The system is eventually consistent: a ticket is briefly `pending_triage`. The UI makes that state visible.
- More moving parts than a direct HTTP call: a broker to run and monitor.

## Alternatives considered

- **Synchronous HTTP call from `tickets-api` to the agent.** Simpler, but couples ticket creation to LLM latency and availability.
- **Kafka.** Built for high-throughput event streams and replay; unnecessary for this volume, and heavier to operate locally.
