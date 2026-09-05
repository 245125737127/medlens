## 1. Setup Architecture and Database

- [x] 1.1 Initialize Next.js project with Tailwind CSS and verify the default page loads.
- [x] 1.2 Initialize FastAPI project with PostgreSQL connection and verify the `/health` endpoint works.
- [x] 1.3 Create SQLAlchemy models (Patient, Document, LabResult, Medication, Condition, Allergy, Conflict) and verify Alembic migrations apply cleanly.

## 2. Patient Intake Workflow

- [x] 2.1 Implement Patient Intake frontend form and verify it captures all demographics, symptoms, and meds.
- [x] 2.2 Implement POST `/api/patients` endpoint and verify data saves to the database correctly.

## 3. Document Processing Pipeline

- [x] 3.1 Implement frontend document upload with drag-and-drop and progress indicator, verifying files are sent successfully.
- [x] 3.2 Implement backend file upload endpoint and verify files are stored locally or in object storage.
- [x] 3.3 Implement AI structured extraction (using Gemini API) and verify it returns JSON conforming to the LabResult and Medication schemas.
- [x] 3.4 Implement backend deterministic reference-range validation logic and verify it correctly flags values as LOW, NORMAL, HIGH, or UNKNOWN based on source ranges.
- [x] 3.5 Persist extracted data with source document IDs, pages, and confidence scores, verifying provenance is saved.

## 4. Medical Dashboard and Source Viewer

- [x] 4.1 Build the Medical Dashboard layout (Overview, Lab Results Table, Medications list) and verify it fetches data from the backend.
- [x] 4.2 Implement the Source Viewer component (side-by-side view) and verify clicking an extracted lab result opens the original document page.

## 5. Verification and Conflict Detection

- [ ] 5.1 Implement backend conflict detection logic (e.g. comparing patient-provided meds to extracted meds) and verify conflicts are flagged in the database.
- [ ] 5.2 Build the Human Verification interface and verify users can accept, edit, or reject uncertain/conflicting extractions.

## 6. AI Summary and Timeline

- [ ] 6.1 Implement AI Summary generation endpoint that strictly uses structured db records and verify it does not invent new medical facts or provide advice.
- [ ] 6.2 Build the Medical Timeline and Report Comparison UI and verify it correctly orders events by date and calculates numerical changes between matching tests.

## 7. Demo Mode and Polish

- [ ] 7.1 Implement `/api/demo/seed` endpoint with synthetic patient data and documents and verify it populates a realistic, complex scenario.
- [ ] 7.2 Run end-to-end testing of the complete workflow (Upload -> Process -> Extract -> Verify -> Dashboard) and fix any visual or functional bugs.
