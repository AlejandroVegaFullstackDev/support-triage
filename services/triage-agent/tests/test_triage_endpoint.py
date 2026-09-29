def test_triage_endpoint_returns_decision(client):
    response = client.post(
        "/triage",
        json={"subject": "Me cobraron dos veces", "body": "La cuota salió duplicada en mi tarjeta"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "billing"
    assert body["provider"] == "local"


def test_triage_endpoint_rejects_unknown_fields(client):
    response = client.post(
        "/triage",
        json={"subject": "Hola", "body": "Texto suficientemente largo", "admin": True},
    )

    assert response.status_code == 422
