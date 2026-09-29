import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../api';
import type { NewTicket } from '../types';

const EXAMPLES: NewTicket[] = [
  {
    subject: 'Me cobraron dos veces la cuota',
    body: 'Este mes el pago de la moto salió duplicado en mi tarjeta. Necesito que me devuelvan uno.',
    customerEmail: 'laura.gomez@example.com',
  },
  {
    subject: 'La app está caída',
    body: 'Desde las 8 am no carga el mapa del GPS y no puedo ver dónde está mi vehículo. Es urgente.',
    customerEmail: 'flota.norte@example.com',
  },
  {
    subject: '¿Cómo cambio mi correo?',
    body: 'Tengo una consulta: quiero actualizar el correo de mi cuenta, ¿cómo lo hago?',
    customerEmail: 'andres.rios@example.com',
  },
];

const EMPTY: NewTicket = { subject: '', body: '', customerEmail: '' };

interface Props {
  onCreate: (ticket: NewTicket) => Promise<unknown>;
}

export function TicketForm({ onCreate }: Props) {
  const [form, setForm] = useState<NewTicket>(EMPTY);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const update = (field: keyof NewTicket) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setErrors([]);
    try {
      await onCreate(form);
      setForm(EMPTY);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.details.length > 0 ? error.details : [error.message]);
      } else {
        setErrors(['No se pudo crear el ticket.']);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="ticket-form" onSubmit={submit} noValidate>
      <h2>Nuevo ticket</h2>
      <p className="hint">
        Escribe como lo haría un cliente. El agente lo clasifica apenas entra a la cola.
      </p>

      <label>
        Asunto
        <input
          value={form.subject}
          onChange={(e) => update('subject')(e.target.value)}
          maxLength={200}
          required
        />
      </label>
      <label>
        Mensaje del cliente
        <textarea
          value={form.body}
          onChange={(e) => update('body')(e.target.value)}
          rows={5}
          maxLength={5000}
          required
        />
      </label>
      <label>
        Correo del cliente
        <input
          type="email"
          value={form.customerEmail}
          onChange={(e) => update('customerEmail')(e.target.value)}
          required
        />
      </label>

      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <button type="submit" className="primary" disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar a la cola'}
      </button>

      <div className="examples">
        <span>Probar con un ejemplo:</span>
        {EXAMPLES.map((example) => (
          <button type="button" key={example.subject} onClick={() => setForm(example)}>
            {example.subject}
          </button>
        ))}
      </div>
    </form>
  );
}
