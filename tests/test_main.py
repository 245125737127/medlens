import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, get_db

client = TestClient(app)
TOKEN = "DEMO_TOKEN"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200

def test_create_patient():
    data = {
        "name": "Test Patient",
        "age": 30,
        "sex": "Male",
        "symptoms": "None",
        "conditions": "None",
        "allergies": "None",
        "medications": "None",
        "additional_notes": "None"
    }
    response = client.post("/api/patients", json=data, headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Patient"
    assert "id" in response.json()

def test_get_patient_unauthorized():
    response = client.get("/api/patients/1")
    assert response.status_code == 401

def test_get_patient_authorized():
    response = client.get("/api/patients/1", headers=HEADERS)
    assert response.status_code == 200

def test_verify_conflict_not_found():
    data = {"action": "accept", "edited_value": None}
    response = client.post("/api/patients/1/verify/conflict/999", json=data, headers=HEADERS)
    assert response.status_code == 404
