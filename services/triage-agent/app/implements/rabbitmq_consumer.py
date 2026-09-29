import logging

import aio_pika
from aio_pika.abc import AbstractExchange, AbstractIncomingMessage, AbstractRobustConnection
from pydantic import ValidationError as PydanticValidationError

from app.controllers.triage_controller import TriageController
from app.dtos.tickets import TicketCreatedEvent
from app.utils.messaging import (
    DEAD_LETTER_EXCHANGE,
    EXCHANGE,
    TICKET_CREATED,
    TICKET_CREATED_QUEUE,
    TICKET_TRIAGED,
)

logger = logging.getLogger(__name__)

PREFETCH = 5


class RabbitMqConsumer:
    """Consumes ticket.created, triages it, publishes ticket.triaged."""

    def __init__(self, url: str, controller: TriageController) -> None:
        self._url = url
        self._controller = controller
        self._connection: AbstractRobustConnection | None = None
        self._exchange: AbstractExchange | None = None

    async def start(self) -> None:
        self._connection = await aio_pika.connect_robust(self._url)
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=PREFETCH)
        self._exchange = await channel.declare_exchange(
            EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True
        )
        dead_letters = await channel.declare_exchange(
            DEAD_LETTER_EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True
        )
        dead_letter_queue = await channel.declare_queue(
            f"{TICKET_CREATED_QUEUE}.dead-letter", durable=True
        )
        await dead_letter_queue.bind(dead_letters, TICKET_CREATED)
        queue = await channel.declare_queue(
            TICKET_CREATED_QUEUE,
            durable=True,
            arguments={"x-dead-letter-exchange": DEAD_LETTER_EXCHANGE},
        )
        await queue.bind(self._exchange, TICKET_CREATED)
        await queue.consume(self._on_message)
        logger.info("Consuming %s", TICKET_CREATED_QUEUE)

    async def stop(self) -> None:
        if self._connection:
            await self._connection.close()

    async def _on_message(self, message: AbstractIncomingMessage) -> None:
        try:
            event = TicketCreatedEvent.model_validate_json(message.body)
        except PydanticValidationError:
            logger.warning("Invalid %s payload, dead-lettering", TICKET_CREATED)
            await message.reject(requeue=False)
            return

        try:
            triaged = await self._controller.handle_ticket_created(event)
            await self._publish(triaged.model_dump_json(by_alias=True).encode())
        except Exception:
            # Unexpected failure: retry once, then dead-letter.
            logger.exception("Failed to triage ticket %s", event.ticket_id)
            await message.nack(requeue=not message.redelivered)
            return
        await message.ack()

    async def _publish(self, body: bytes) -> None:
        if self._exchange is None:
            raise RuntimeError("Consumer not started")
        await self._exchange.publish(
            aio_pika.Message(
                body=body,
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=TICKET_TRIAGED,
        )
