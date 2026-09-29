import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import type { NewTicket, Ticket } from './types';

const FAST_POLL_MS = 1500;
const SLOW_POLL_MS = 10_000;
const FLASH_MS = 1600;

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [justTriaged, setJustTriaged] = useState<Set<string>>(new Set());
  const pendingIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const next = await api.listTickets();
      const newlyTriaged = next.filter((t) => t.status === 'triaged' && pendingIds.current.has(t.id));
      if (newlyTriaged.length > 0) {
        const ids = newlyTriaged.map((t) => t.id);
        setJustTriaged((prev) => new Set([...prev, ...ids]));
        setTimeout(() => {
          setJustTriaged((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
        }, FLASH_MS);
      }
      pendingIds.current = new Set(next.filter((t) => t.status === 'pending_triage').map((t) => t.id));
      setTickets(next);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cargar la cola.');
    } finally {
      setLoaded(true);
    }
  }, []);

  const hasPending = tickets.some((t) => t.status === 'pending_triage');

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), hasPending ? FAST_POLL_MS : SLOW_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh, hasPending]);

  const create = useCallback(
    async (ticket: NewTicket) => {
      const created = await api.createTicket(ticket);
      pendingIds.current.add(created.id);
      setTickets((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  return { tickets, loaded, loadError, justTriaged, create };
}
