import os
import re
from google import genai
from pydantic import BaseModel
from schemas import ExtractedData
import models

# Initialize Gemini Client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "dummy_key"))

def extract_information_from_document(file_path: str, mime_type: str) -> ExtractedData:
    """Uses Gemini API to extract structured data from a medical document."""
    # In a real environment with a valid API key, we would upload the file and prompt the model.
    # For a prototype/demo mode, if API key is not valid, we can return dummy structured data
    # or actually try to call the API if it's set.
    
    if os.environ.get("GEMINI_API_KEY") == "dummy_key" or not os.environ.get("GEMINI_API_KEY"):
        # Return mock data for the prototype if no key is present to allow testing
        return ExtractedData(
            lab_results=[
                {
                    "test_name": "Hemoglobin",
                    "value": 12.1,
                    "unit": "g/dL",
                    "reference_range": "13-17",
                    "date": "2026-09-04",
                    "confidence": 0.96,
                    "source_page": 1
                },
                {
                    "test_name": "WBC",
                    "value": 7800,
                    "unit": "/µL",
                    "reference_range": "4000-11000",
                    "date": "2026-09-04",
                    "confidence": 0.99,
                    "source_page": 1
                },
                {
                    "test_name": "Vitamin D",
                    "value": 22.0,
                    "unit": "ng/mL",
                    "reference_range": None, # Demonstrating missing reference range
                    "date": "2026-09-04",
                    "confidence": 0.85,
                    "source_page": 2
                }
            ],
            medications=[
                {
                    "medication_name": "Metformin",
                    "strength_dose": "850 mg",
                    "frequency": "Twice daily",
                    "date": "2026-09-04",
                    "confidence": 0.92,
                    "source_page": 2
                }
            ]
        )

    # Actual API call (if key is provided)
    try:
        uploaded_file = client.files.upload(file=file_path)
        
        prompt = """
        Analyze this medical document and extract all laboratory results and medications.
        For each lab result, extract the test name, numerical value, unit, and the explicitly stated reference range.
        If a reference range is not provided in the document, return null. Do NOT invent a reference range.
        For each medication, extract the name, dose/strength, frequency, and date.
        Provide a confidence score between 0.0 and 1.0 for each extraction.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[uploaded_file, prompt],
            config={
                'response_mime_type': 'application/json',
                'response_schema': ExtractedData,
            },
        )
        
        # We need to parse the JSON response into our Pydantic model
        import json
        extracted = ExtractedData.model_validate_json(response.text)
        return extracted
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Fallback for hackathon continuity
        return ExtractedData(lab_results=[], medications=[])


def evaluate_reference_range(value: float, reference_range: str) -> str:
    """Deterministically evaluates if a value is LOW, NORMAL, HIGH, or UNKNOWN based on the reference range."""
    if not reference_range:
        return "UNKNOWN"
        
    # Attempt to parse common range formats like "13-17", "13.0 - 17.5", "13 to 17"
    range_str = reference_range.replace("to", "-").replace(" ", "")
    
    # Check for < or >
    if range_str.startswith("<"):
        try:
            upper_bound = float(re.findall(r"[-+]?\d*\.\d+|\d+", range_str)[0])
            if value < upper_bound:
                return "NORMAL"
            else:
                return "HIGH"
        except (IndexError, ValueError):
            return "UNKNOWN"
            
    if range_str.startswith(">"):
        try:
            lower_bound = float(re.findall(r"[-+]?\d*\.\d+|\d+", range_str)[0])
            if value > lower_bound:
                return "NORMAL"
            else:
                return "LOW"
        except (IndexError, ValueError):
            return "UNKNOWN"
            
    # Try parsing "min-max"
    parts = re.findall(r"[-+]?\d*\.\d+|\d+", range_str)
    if len(parts) >= 2:
        try:
            min_val = float(parts[0])
            max_val = float(parts[1])
            
            if min_val > max_val:
                # Swap if they were parsed backwards
                min_val, max_val = max_val, min_val
                
            if value < min_val:
                return "LOW"
            elif value > max_val:
                return "HIGH"
            else:
                return "NORMAL"
        except ValueError:
            return "UNKNOWN"
            
    return "UNKNOWN"

def detect_conflicts(db, patient_id: int):
    """Simple conflict detection for prototype: Checks if extracted meds conflict with patient provided meds"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient or not patient.medications:
        return
        
    patient_meds_lower = patient.medications.lower()
    
    extracted_meds = db.query(models.Medication).filter(
        models.Medication.patient_id == patient_id
    ).all()
    
    for med in extracted_meds:
        # Check if the extracted medication name appears in patient provided list (basic check)
        if med.medication_name.lower() not in patient_meds_lower:
            # Create a conflict record
            existing_conflict = db.query(models.Conflict).filter(
                models.Conflict.patient_id == patient_id,
                models.Conflict.extracted_data == med.medication_name
            ).first()
            
            if not existing_conflict:
                conflict = models.Conflict(
                    patient_id=patient_id,
                    conflict_type="Medication Mismatch",
                    description=f"Medication '{med.medication_name}' found in report but not listed by patient.",
                    patient_provided_data=patient.medications,
                    extracted_data=med.medication_name,
                    status="Needs Verification"
                )
                db.add(conflict)
    db.commit()

def process_document_and_save(db, document: models.Document, file_path: str, mime_type: str):
    """Processes a document, extracts data, evaluates ranges, and persists to DB."""
    try:
        # Extract data
        extracted_data = extract_information_from_document(file_path, mime_type)
        
        # Process and save Lab Results
        for lab in extracted_data.lab_results:
            status = evaluate_reference_range(lab.value, lab.reference_range)
            
            db_lab = models.LabResult(
                patient_id=document.patient_id,
                test_name=lab.test_name,
                value=lab.value,
                unit=lab.unit,
                reference_range=lab.reference_range,
                date=lab.date,
                status=status,
                source_document=document.filename,
                source_document_id=document.id,
                source_page=lab.source_page,
                confidence=lab.confidence,
                verified=False
            )
            db.add(db_lab)
            
        # Process and save Medications
        for med in extracted_data.medications:
            db_med = models.Medication(
                patient_id=document.patient_id,
                medication_name=med.medication_name,
                strength_dose=med.strength_dose,
                frequency=med.frequency,
                date=med.date,
                source_document=document.filename,
                source_document_id=document.id,
                source_page=med.source_page,
                confidence=med.confidence,
                verified=False
            )
            db.add(db_med)
            
        document.status = "Completed"
        db.commit()
        
        # Run conflict detection
        detect_conflicts(db, document.patient_id)
        
    except Exception as e:
        print(f"Error processing document: {e}")
        document.status = f"Error: {str(e)}"
        db.commit()

def generate_patient_summary(patient_data: dict) -> str:
    """Uses Gemini API to summarize patient information."""
    if os.environ.get("GEMINI_API_KEY") == "dummy_key" or not os.environ.get("GEMINI_API_KEY"):
        return "This is a mock AI summary. Patient is a " + str(patient_data.get('age', 'unknown')) + " year old " + str(patient_data.get('sex', 'unknown')) + ". They have reported symptoms including " + str(patient_data.get('symptoms', 'None')) + ". Recent lab results indicate some abnormalities which require human verification."

    try:
        prompt = f"""
        Summarize the following patient's clinical history based ONLY on the provided structured data.
        
        RULES:
        - Do not invent facts, symptoms, or tests that are not present.
        - Do not provide medical diagnosis or treatment recommendations.
        - Use patient-friendly language.
        - Structure the summary into 'Patient Profile', 'Current Medications', and 'Recent Lab Trends' if applicable.
        
        DATA:
        {patient_data}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Error generating summary: {e}")
        return "An error occurred while generating the AI summary. Please check the API configuration."

