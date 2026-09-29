import type { NewTicket, Ticket } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError('No hay conexión con la API de tickets. Revisa que el servicio esté arriba.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const details = Array.isArray(body.message) ? body.message : [];
    throw new ApiError(`La API respondió ${response.status}.`, details);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listTickets: () => request<Ticket[]>('/tickets'),
  createTicket: (ticket: NewTicket) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
};
