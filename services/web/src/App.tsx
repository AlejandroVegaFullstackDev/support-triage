import { TicketForm } from './components/TicketForm';
import { TicketQueue } from './components/TicketQueue';
import { useTickets } from './useTickets';

export function App() {
  const { tickets, loaded, loadError, justTriaged, create } = useTickets();
  const urgent = tickets.filter((t) => t.priority === 'urgent').length;
  const pending = tickets.filter((t) => t.status === 'pending_triage').length;

  return (
    <div className="shell">
      <header className="masthead">
        <h1>Triage de soporte</h1>
        <p className="counts" aria-live="polite">
          <span>{tickets.length} en cola</span>
          <span className={urgent > 0 ? 'has-urgent' : undefined}>{urgent} {urgent === 1 ? 'urgente' : 'urgentes'}</span>
          {pending > 0 && <span>{pending} clasificándose</span>}
        </p>
      </header>

      <main className="layout">
        <aside>
          <TicketForm onCreate={create} />
        </aside>
        <section aria-label="Cola de tickets">
          {loadError && (
            <p className="banner-error" role="alert">
              {loadError}
            </p>
          )}
          {loaded && <TicketQueue tickets={tickets} justTriaged={justTriaged} />}
        </section>
      </main>
    </div>
  );
}
