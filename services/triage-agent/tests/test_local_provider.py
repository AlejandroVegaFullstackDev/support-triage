import pytest

from app.dtos.tickets import Category, Priority
from app.implements.local_provider import LocalProvider


@pytest.mark.parametrize(
    ("subject", "body", "category", "priority"),
    [
        (
            "Me cobraron dos veces",
            "El pago de la cuota salió duplicado en mi tarjeta",
            Category.BILLING,
            Priority.HIGH,
        ),
        (
            "La app está caída",
            "No carga nada desde esta mañana, es urgente",
            Category.TECHNICAL,
            Priority.URGENT,
        ),
        (
            "No puedo iniciar sesión",
            "Olvidé mi contraseña y la cuenta quedó bloqueada",
            Category.ACCOUNT,
            Priority.HIGH,
        ),
        (
            "¿Dónde va mi paquete?",
            "Quisiera saber el rastreo de mi envío, es solo una consulta",
            Category.SHIPPING,
            Priority.LOW,
        ),
        (
            "¿Cómo cambio mi correo?",
            "Tengo una consulta: quiero actualizar el correo de mi cuenta",
            Category.ACCOUNT,
            Priority.LOW,
        ),
        ("Hola", "Quería dejar un comentario sobre el servicio", Category.OTHER, Priority.MEDIUM),
        (
            "Charged twice",
            "My payment was charged twice this month",
            Category.BILLING,
            Priority.HIGH,
        ),
    ],
)
async def test_classifies_common_tickets(subject, body, category, priority):
    decision = await LocalProvider().classify(subject, body)

    assert decision.category == category
    assert decision.priority == priority
    assert decision.suggested_reply
