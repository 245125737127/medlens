## Why

MedLens is an AI-powered clinical information intelligence prototype. The problem it solves is the fragmentation of medical information—patient history, prescriptions, lab reports, and previous records. AI is used to organize and explain this medical record, rather than diagnosing or acting as the medical record itself. This product is necessary as a working prototype for a hackathon, demonstrating a safe and traceable way to extract structured data from medical documents and empower users with human-verification and clear provenance.

## What Changes

This change introduces the full MedLens prototype application:
- Implement a Next.js (React/Tailwind) frontend and FastAPI (Python) backend.
- Build a Patient Intake system to capture patient-provided information.
- Implement a Document Upload system (PDFs, images) with processing status.
- Add AI Structured Extraction for lab results, medications, and conditions with confidence scores.
- Build Reference-Range Awareness deterministically into the backend (LOW/NORMAL/HIGH evaluation).
- Introduce a Source and Provenance tracker for all extracted facts.
- Create a Human Verification interface to review uncertain extractions.
- Implement Conflict Detection between patient-provided and report-extracted data.
- Add a Patient-Friendly AI Summary that only uses structured, validated data.
- Build a Medical Timeline, Report Comparison, and Source Viewer features.
- Provide a Demo Mode to quickly populate realistic synthetic data for judges.

## Capabilities

### New Capabilities
- `patient-intake`: Captures patient-provided demographics, symptoms, and current medications without AI overwrite.
- `document-processing`: Handles uploads and uses AI to extract structured facts (labs, meds, conditions) with provenance and confidence.
- `medical-dashboard`: Displays the structured medical record, timeline, report comparisons, and source viewing side-by-side.
- `verification-and-conflicts`: Detects conflicts across records and provides an interface for human review of low-confidence or conflicting data.
- `ai-summary`: Generates a patient-friendly summary strictly from the structured record without diagnosing or prescribing.
- `reference-range-eval`: Deterministically evaluates lab values against source-provided reference ranges.

### Modified Capabilities
<!-- No existing capabilities as this is a new project. -->

## Impact

This is a greenfield prototype. It establishes the full-stack architecture: Next.js frontend, FastAPI backend, PostgreSQL database, and AI API integrations. It introduces rigorous safety boundaries around AI extraction and structured data evaluation.
