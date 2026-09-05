from pydantic import BaseModel
from typing import Optional

class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    symptoms: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    additional_notes: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    sex: str
    
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    
    class Config:
        from_attributes = True

class LabResultResponse(BaseModel):
    id: int
    test_name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    date: Optional[str] = None
    status: str
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    confidence: float
    verified: bool

    class Config:
        from_attributes = True

class MedicationResponse(BaseModel):
    id: int
    medication_name: str
    strength_dose: Optional[str] = None
    frequency: Optional[str] = None
    date: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    confidence: float
    verified: bool

    class Config:
        from_attributes = True

class ConflictResponse(BaseModel):
    id: int
    conflict_type: str
    description: str
    patient_provided_data: Optional[str] = None
    extracted_data: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class PatientDetailResponse(PatientResponse):
    symptoms: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    additional_notes: Optional[str] = None
    lab_results: list[LabResultResponse] = []
    extracted_medications: list[MedicationResponse] = []
    documents: list[DocumentResponse] = []
    conflicts: list[ConflictResponse] = []

class VerificationRequest(BaseModel):
    action: str # 'accept', 'reject', 'edit'
    edited_value: Optional[str] = None

class ExtractedLabResult(BaseModel):
    test_name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    date: Optional[str] = None
    confidence: float
    source_page: Optional[int] = 1

class ExtractedMedication(BaseModel):
    medication_name: str
    strength_dose: Optional[str] = None
    frequency: Optional[str] = None
    date: Optional[str] = None
    confidence: float
    source_page: Optional[int] = 1

class ExtractedData(BaseModel):
    lab_results: list[ExtractedLabResult]
    medications: list[ExtractedMedication]

class SummaryResponse(BaseModel):
    patient_id: int
    summary_text: str


