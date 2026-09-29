import type { Category, Priority } from './types';

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  billing: 'Pagos',
  technical: 'Técnico',
  account: 'Cuenta',
  shipping: 'Envíos',
  other: 'Otro',
};

export const PROVIDER_LABEL: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  local: 'Reglas locales',
};

const minute = 60_000;

export function timeAgo(iso: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed < minute) return 'hace un momento';
  if (elapsed < 60 * minute) return `hace ${Math.floor(elapsed / minute)} min`;
  if (elapsed < 24 * 60 * minute) return `hace ${Math.floor(elapsed / (60 * minute))} h`;
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Pending first (being worked on), then by priority, then newest. */
export function sortQueue<T extends { status: string; priority: Priority | null; createdAt: string }>(
  tickets: T[],
): T[] {
  return [...tickets].sort((a, b) => {
    const pending = Number(b.status === 'pending_triage') - Number(a.status === 'pending_triage');
    if (pending !== 0) return pending;
    const rank = (t: T) => (t.priority ? PRIORITY_ORDER[t.priority] : 4);
    return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt);
  });
}
