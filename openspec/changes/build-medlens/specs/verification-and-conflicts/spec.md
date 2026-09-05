## Purpose

Detects conflicts across records and provides an interface for human review of low-confidence or conflicting data.

## ADDED Requirements

### Requirement: Conflict Detection and Review
The system SHALL detect discrepancies between patient-provided and report-extracted data, and provide an interface to accept, edit, or reject uncertain extractions.

#### Scenario: Information conflict detected
- **WHEN** a medication dose reported by the patient differs from an uploaded document
- **THEN** the system flags the conflict and prompts for human verification.
