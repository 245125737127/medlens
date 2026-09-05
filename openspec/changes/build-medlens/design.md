## Context

MedLens is a new application. We need to rapidly establish a full-stack architecture that is robust enough to process medical documents, store structured data, and display it cleanly. We will build a React frontend with Next.js and a Python backend with FastAPI, backed by PostgreSQL.

## Goals / Non-Goals

**Goals:**
- Implement a clear separation of concerns between raw document upload, AI extraction, and structured database storage.
- Ensure all AI-extracted facts maintain traceability (source document and page) back to the original source.
- Implement a deterministic reference-range comparison in the backend.

**Non-Goals:**
- Complex authentication or multi-tenant user management (out of scope for hackathon prototype).
- Direct AI modification of patient-provided data.
- Medical diagnosis or treatment recommendation generation.

## Decisions

- **Architecture:** Next.js (Frontend) + FastAPI (Backend) + PostgreSQL (Database).
  - *Rationale*: Next.js provides rapid UI development with React and Tailwind. FastAPI is ideal for handling AI API integrations and asynchronous document processing tasks in Python. PostgreSQL provides robust relational data storage for structured facts and provenance.
- **AI Integration Strategy:**
  - *Rationale*: We will use an AI API (e.g., Gemini) with strict JSON output schemas to extract structured data. We will avoid open-ended summarization except for the explicitly sandboxed "AI Summary" feature, which will only be fed the verified structured data from the database, not raw documents.
- **Reference Range Evaluation:**
  - *Rationale*: The backend will implement numeric parsing and inequality checks based strictly on the `reference_range` string parsed from the source. AI will NOT be trusted to determine if a value is LOW/NORMAL/HIGH.
- **Demo Mode:**
  - *Rationale*: We will include an API endpoint to seed the database with a pre-configured "Demo Patient" and synthetic reports, allowing quick demonstration of all edge cases (conflicts, missing ranges, low confidence).

## Risks / Trade-offs

- **Risk**: OCR or AI extraction failures on complex medical PDFs.
  - *Mitigation*: We will require the AI to provide a confidence score for each extracted fact. Any low-confidence extraction will be flagged for human verification.
- **Risk**: Hallucination of reference ranges.
  - *Mitigation*: The prompt schema will explicitly instruct the AI to return `null` if a reference range is not explicitly present in the document text. The backend will map this to an `UNKNOWN` status.
