import re
import unicodedata

from app.dtos.tickets import Category, Priority, TriageDecision
from app.services.llm_provider import LLMProvider

CATEGORY_KEYWORDS: dict[Category, tuple[str, ...]] = {
    Category.BILLING: (
        "cobro",
        "cobraron",
        "pago",
        "factura",
        "reembolso",
        "tarjeta",
        "cuota",
        "charge",
        "payment",
        "invoice",
        "refund",
        "billing",
    ),
    Category.ACCOUNT: (
        "contrasena",
        "clave",
        "acceso",
        "iniciar sesion",
        "login",
        "cuenta bloqueada",
        "mi cuenta",
        "mi correo",
        "datos personales",
        "password",
        "account",
        "sign in",
    ),
    Category.SHIPPING: (
        "envio",
        "entrega",
        "paquete",
        "guia",
        "rastreo",
        "shipping",
        "delivery",
        "package",
        "tracking",
    ),
    Category.TECHNICAL: (
        "error",
        "falla",
        "no funciona",
        "caido",
        "caida",
        "bug",
        "lento",
        "crash",
        "down",
        "not working",
        "timeout",
    ),
}

PRIORITY_KEYWORDS: dict[Priority, tuple[str, ...]] = {
    Priority.URGENT: (
        "urgente",
        "fraude",
        "robo",
        "hackeo",
        "caido",
        "caida",
        "no puedo pagar",
        "urgent",
        "fraud",
        "hacked",
        "outage",
    ),
    Priority.HIGH: (
        "no puedo",
        "bloqueado",
        "bloqueada",
        "cobraron dos veces",
        "duplicado",
        "no funciona",
        "cannot",
        "can't",
        "blocked",
        "charged twice",
    ),
    Priority.LOW: ("pregunta", "consulta", "informacion", "como puedo", "question", "how do i"),
}

REPLIES: dict[Category, str] = {
    Category.BILLING: (
        "Hola, gracias por escribirnos. Ya estamos revisando el movimiento que mencionas "
        "y te confirmaremos el estado de tu pago lo antes posible."
    ),
    Category.ACCOUNT: (
        "Hola, gracias por avisarnos. Te ayudaremos a recuperar el acceso a tu cuenta. "
        "Nunca te pediremos tu contraseña por este medio."
    ),
    Category.SHIPPING: (
        "Hola, gracias por escribirnos. Estamos revisando el estado de tu envío con la "
        "transportadora y te daremos una actualización pronto."
    ),
    Category.TECHNICAL: (
        "Hola, gracias por reportarlo. Nuestro equipo técnico ya está revisando el error. "
        "Si tienes capturas de pantalla, compártelas en este mismo hilo."
    ),
    Category.OTHER: (
        "Hola, gracias por escribirnos. Recibimos tu mensaje y un agente te responderá pronto."
    ),
}


def normalize(text: str) -> str:
    stripped = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", stripped.lower())


def count_matches(text: str, keywords: tuple[str, ...]) -> int:
    return sum(1 for keyword in keywords if keyword in text)


class LocalProvider(LLMProvider):
    """Deterministic keyword classifier: free, offline, and the fallback for other providers."""

    name = "local"

    async def classify(self, subject: str, body: str) -> TriageDecision:
        text = normalize(f"{subject} {body}")
        scores = {
            category: count_matches(text, words) for category, words in CATEGORY_KEYWORDS.items()
        }
        best_category, best_score = max(scores.items(), key=lambda item: item[1])
        category = best_category if best_score > 0 else Category.OTHER

        priority = Priority.MEDIUM
        for level in (Priority.URGENT, Priority.HIGH, Priority.LOW):
            if count_matches(text, PRIORITY_KEYWORDS[level]) > 0:
                priority = level
                break

        return TriageDecision(
            category=category, priority=priority, suggested_reply=REPLIES[category]
        )
