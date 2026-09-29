import { useState } from 'react';
import { CATEGORY_LABEL, PRIORITY_LABEL, PROVIDER_LABEL, sortQueue, timeAgo } from '../labels';
import type { Ticket } from '../types';

interface Props {
  tickets: Ticket[];
  justTriaged: Set<string>;
}

export function TicketQueue({ tickets, justTriaged }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (tickets.length === 0) {
    return (
      <div className="empty">
        <p>La cola está vacía.</p>
        <p className="hint">Crea un ticket a la izquierda y míralo llegar aquí ya clasificado.</p>
      </div>
    );
  }

  return (
    <ol className="queue">
      {sortQueue(tickets).map((ticket) => {
        const open = openId === ticket.id;
        const pending = ticket.status === 'pending_triage';
        return (
          <li
            key={ticket.id}
            className={`row priority-${ticket.priority ?? 'none'}${justTriaged.has(ticket.id) ? ' flash' : ''}`}
          >
            <button
              type="button"
              className="row-summary"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : ticket.id)}
            >
              <span className="signal" aria-hidden="true" />
              <span className="row-main">
                <span className="subject">{ticket.subject}</span>
                <span className="excerpt">{ticket.body}</span>
              </span>
              <span className="row-meta">
                {pending ? (
                  <span className="status-pending">Clasificando…</span>
                ) : (
                  <>
                    <span className="priority-label">{PRIORITY_LABEL[ticket.priority!]}</span>
                    <span className="category">{CATEGORY_LABEL[ticket.category!]}</span>
                  </>
                )}
                <time dateTime={ticket.createdAt}>{timeAgo(ticket.createdAt)}</time>
              </span>
            </button>
            {open && (
              <div className="row-detail">
                <p className="from">De {ticket.customerEmail}</p>
                <p className="body">{ticket.body}</p>
                {ticket.suggestedReply ? (
                  <figure className="reply">
                    <figcaption>
                      Respuesta sugerida por {PROVIDER_LABEL[ticket.triageProvider ?? ''] ?? ticket.triageProvider}
                    </figcaption>
                    <blockquote>{ticket.suggestedReply}</blockquote>
                  </figure>
                ) : (
                  <p className="hint">El agente aún no ha respondido este ticket.</p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
