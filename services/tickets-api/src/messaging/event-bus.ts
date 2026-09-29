export type MessageHandler = (payload: unknown) => Promise<void>;

export interface EventBus {
  publish(routingKey: string, payload: object): Promise<void>;
  subscribe(queue: string, routingKey: string, handler: MessageHandler): Promise<void>;
}

export const EVENT_BUS = Symbol('EVENT_BUS');

/** Thrown by a handler when a message can never succeed; it goes to the dead-letter queue. */
export class InvalidMessageError extends Error {}
