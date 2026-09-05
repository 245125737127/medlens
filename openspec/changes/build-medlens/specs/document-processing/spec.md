## Purpose

Handles medical document uploads and uses AI to extract structured facts (labs, meds, conditions) with provenance and confidence scores.

## ADDED Requirements

### Requirement: Document Upload and Processing
The system SHALL accept PDF and image uploads, process them via AI extraction, and return structured JSON records with source document references.

#### Scenario: User uploads medical report
- **WHEN** a medical document is uploaded
- **THEN** the system updates the processing status and extracts structured laboratory, medication, and condition data with provenance and confidence metrics.
