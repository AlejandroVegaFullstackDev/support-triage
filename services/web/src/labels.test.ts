import { describe, expect, it } from 'vitest';
import { sortQueue, timeAgo } from './labels';

describe('sortQueue', () => {
  it('puts pending tickets first, then by priority, then newest', () => {
    const tickets = [
      { id: 'low', status: 'triaged', priority: 'low' as const, createdAt: '2026-09-29T10:00:00Z' },
      { id: 'pending', status: 'pending_triage', priority: null, createdAt: '2026-09-29T09:00:00Z' },
      { id: 'urgent-old', status: 'triaged', priority: 'urgent' as const, createdAt: '2026-09-29T08:00:00Z' },
      { id: 'urgent-new', status: 'triaged', priority: 'urgent' as const, createdAt: '2026-09-29T11:00:00Z' },
    ];

    expect(sortQueue(tickets).map((t) => t.id)).toEqual(['pending', 'urgent-new', 'urgent-old', 'low']);
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-09-29T12:00:00Z');

  it('formats recent times in Spanish', () => {
    expect(timeAgo('2026-09-29T11:59:30Z', now)).toBe('hace un momento');
    expect(timeAgo('2026-09-29T11:45:00Z', now)).toBe('hace 15 min');
    expect(timeAgo('2026-09-29T09:00:00Z', now)).toBe('hace 3 h');
  });
});
