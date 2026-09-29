# 3. Publish after commit (no outbox yet)

**Status:** accepted, with a known gap

## Context

`tickets-api` writes the ticket to PostgreSQL and then publishes `ticket.created`. These are two systems without a shared transaction.

## Decision

Commit the ticket first, then publish. If publishing fails, the request still succeeds (the customer's ticket is not lost), the error is logged, and the ticket stays `pending_triage`.

## Consequences

- A broker outage at the wrong moment leaves a ticket untriaged until someone acts. The UI shows it as "Clasificando…" indefinitely.
- No duplicate tickets and no lost tickets, which matter more here than a delayed classification.

## When to revisit

Adopt the **transactional outbox** pattern: insert the event into an `outbox` table in the same transaction as the ticket, and have a relay publish pending rows and mark them sent. That closes the gap without distributed transactions. Not done yet because at this scale a periodic "re-publish tickets pending for more than N minutes" job would be simpler, and neither is needed until the system has real traffic (YAGNI).
