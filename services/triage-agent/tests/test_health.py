def test_health_reports_active_provider(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "triage-agent", "provider": "local"}
