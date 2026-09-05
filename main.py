from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, engine, Base
from schemas import PatientCreate, PatientResponse, DocumentResponse, PatientDetailResponse
import schemas
import models
import shutil
import os
from document_processor import process_document_and_save

app = FastAPI(title="MedLens API")

# Mount uploads directory for static file serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "db_status": db_status}

@app.post("/api/patients", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients/{patient_id}", response_model=PatientDetailResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.post("/api/patients/{patient_id}/documents", response_model=DocumentResponse)
async def upload_document(
    patient_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_document = models.Document(
        patient_id=patient_id,
        filename=file.filename,
        file_type=file.content_type,
        status="Processing"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Process document in background
    background_tasks.add_task(process_document_and_save, db, db_document, file_path, file.content_type)
    
    return db_document

from schemas import VerificationRequest

@app.post("/api/patients/{patient_id}/verify/conflict/{conflict_id}")
def verify_conflict(patient_id: int, conflict_id: int, req: VerificationRequest, db: Session = Depends(get_db)):
    conflict = db.query(models.Conflict).filter(models.Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
        
    if req.action == "accept":
        conflict.status = "Resolved (Accepted Extracted)"
    elif req.action == "reject":
        conflict.status = "Resolved (Kept Patient Provided)"
    elif req.action == "edit" and req.edited_value:
        conflict.status = f"Resolved (Edited: {req.edited_value})"
        
    db.commit()
    return {"status": "ok"}

@app.post("/api/patients/{patient_id}/verify/lab/{lab_id}")
def verify_lab(patient_id: int, lab_id: int, req: VerificationRequest, db: Session = Depends(get_db)):
    lab = db.query(models.LabResult).filter(models.LabResult.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab result not found")
        
    if req.action == "accept":
        lab.verified = True
    elif req.action == "edit" and req.edited_value:
        try:
            lab.value = float(req.edited_value)
            lab.verified = True
        except ValueError:
            pass
    elif req.action == "reject":
        db.delete(lab)
        
    db.commit()
    return {"status": "ok"}

@app.post("/api/patients/{patient_id}/verify/med/{med_id}")
def verify_medication(patient_id: int, med_id: int, req: VerificationRequest, db: Session = Depends(get_db)):
    med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    if req.action == "accept":
        med.verified = True
    elif req.action == "edit" and req.edited_value:
        med.medication_name = req.edited_value
        med.verified = True
    elif req.action == "reject":
        db.delete(med)
        
    db.commit()
    return {"status": "ok"}

@app.get("/api/patients/{patient_id}/summary", response_model=schemas.SummaryResponse)
def get_patient_summary(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Build data dictionary for summarization
    data = {
        "name": patient.name,
        "age": patient.age,
        "sex": patient.sex,
        "symptoms": patient.symptoms,
        "conditions": patient.conditions,
        "allergies": patient.allergies,
        "medications": patient.medications,
        "lab_results": [{"test_name": lab.test_name, "value": lab.value, "unit": lab.unit, "status": lab.status} for lab in patient.lab_results],
        "extracted_medications": [{"name": med.medication_name, "dose": med.strength_dose} for med in patient.extracted_medications]
    }
    
    from document_processor import generate_patient_summary
    summary = generate_patient_summary(data)
    
    return {"patient_id": patient_id, "summary_text": summary}

@app.post("/api/demo/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seeds the database with a complex synthetic patient for demo purposes."""
    # Check if patient exists to prevent duplicate seeding
    if db.query(models.Patient).filter(models.Patient.name == "Jane Doe (Demo)").first():
        return {"status": "already seeded"}
        
    patient = models.Patient(
        name="Jane Doe (Demo)",
        age=58,
        sex="Female",
        symptoms="Fatigue, frequent urination, increased thirst",
        conditions="Type 2 Diabetes, Hypertension",
        allergies="Penicillin",
        medications="Metformin 500mg BID\nLisinopril 10mg Daily",
        additional_notes="Patient presents for routine follow-up."
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Add a mock document
    doc = models.Document(
        patient_id=patient.id,
        filename="Comprehensive_Metabolic_Panel_2026.pdf",
        file_type="application/pdf",
        status="Completed"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Add some Lab Results
    labs = [
        models.LabResult(patient_id=patient.id, test_name="Glucose, Fasting", value=145.0, unit="mg/dL", reference_range="70-99", date="2026-09-01", status="HIGH", source_document=doc.filename, source_document_id=doc.id, confidence=0.95, verified=True),
        models.LabResult(patient_id=patient.id, test_name="Hemoglobin A1C", value=7.2, unit="%", reference_range="< 5.7", date="2026-09-01", status="HIGH", source_document=doc.filename, source_document_id=doc.id, confidence=0.98, verified=True),
        models.LabResult(patient_id=patient.id, test_name="Hemoglobin A1C", value=6.8, unit="%", reference_range="< 5.7", date="2026-03-15", status="HIGH", source_document=doc.filename, source_document_id=doc.id, confidence=0.91, verified=True), # Older one to show trend
        models.LabResult(patient_id=patient.id, test_name="Creatinine", value=0.9, unit="mg/dL", reference_range="0.5-1.1", date="2026-09-01", status="NORMAL", source_document=doc.filename, source_document_id=doc.id, confidence=0.99, verified=True),
        models.LabResult(patient_id=patient.id, test_name="TSH", value=4.5, unit="uIU/mL", reference_range="0.4-4.0", date="2026-09-01", status="HIGH", source_document=doc.filename, source_document_id=doc.id, confidence=0.72, verified=False) # Low confidence
    ]
    db.add_all(labs)
    
    # Add Medications
    meds = [
        models.Medication(patient_id=patient.id, medication_name="Metformin", strength_dose="500 mg", frequency="Twice daily", date="2026-09-01", source_document=doc.filename, source_document_id=doc.id, confidence=0.99, verified=True),
        models.Medication(patient_id=patient.id, medication_name="Atorvastatin", strength_dose="20 mg", frequency="Daily", date="2026-09-01", source_document=doc.filename, source_document_id=doc.id, confidence=0.75, verified=False) # Conflict!
    ]
    db.add_all(meds)
    
    # Add a Conflict
    conflict = models.Conflict(
        patient_id=patient.id,
        conflict_type="Medication Mismatch",
        description="Medication 'Atorvastatin' found in report but not listed by patient.",
        patient_provided_data="Metformin 500mg BID\nLisinopril 10mg Daily",
        extracted_data="Atorvastatin",
        status="Needs Verification"
    )
    db.add(conflict)
    
    db.commit()
    return {"status": "success", "patient_id": patient.id}
