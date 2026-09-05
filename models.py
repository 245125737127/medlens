from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    sex = Column(String)
    symptoms = Column(Text)
    conditions = Column(Text)
    allergies = Column(Text)
    medications = Column(Text)
    additional_notes = Column(Text)
    
    documents = relationship("Document", back_populates="patient")
    lab_results = relationship("LabResult", back_populates="patient")
    extracted_medications = relationship("Medication", back_populates="patient")
    conflicts = relationship("Conflict", back_populates="patient")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    filename = Column(String)
    file_type = Column(String)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String) # processing, completed, error
    
    patient = relationship("Patient", back_populates="documents")
    lab_results = relationship("LabResult", back_populates="source_document_ref")
    medications = relationship("Medication", back_populates="source_document_ref")

class LabResult(Base):
    __tablename__ = "laboratory_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    test_name = Column(String, index=True)
    value = Column(Float)
    unit = Column(String)
    reference_range = Column(String)
    date = Column(String)
    status = Column(String) # LOW, NORMAL, HIGH, UNKNOWN
    source_document = Column(String)
    source_document_id = Column(Integer, ForeignKey("documents.id"))
    source_page = Column(Integer)
    confidence = Column(Float)
    verified = Column(Boolean, default=False)
    
    patient = relationship("Patient", back_populates="lab_results")
    source_document_ref = relationship("Document", back_populates="lab_results")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medication_name = Column(String, index=True)
    strength_dose = Column(String)
    frequency = Column(String)
    date = Column(String)
    source_document = Column(String)
    source_document_id = Column(Integer, ForeignKey("documents.id"))
    source_page = Column(Integer)
    confidence = Column(Float)
    verified = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="extracted_medications")
    source_document_ref = relationship("Document", back_populates="medications")

class Conflict(Base):
    __tablename__ = "conflicts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    conflict_type = Column(String)
    description = Column(Text)
    patient_provided_data = Column(Text)
    extracted_data = Column(Text)
    status = Column(String) # Needs Verification, Resolved
    
    patient = relationship("Patient", back_populates="conflicts")
