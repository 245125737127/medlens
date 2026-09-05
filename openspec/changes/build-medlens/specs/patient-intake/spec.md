## Purpose

Captures patient-provided demographics, symptoms, and current medications without allowing AI to overwrite them.

## ADDED Requirements

### Requirement: Capture patient information
The system SHALL provide a form to capture patient name, age, sex, symptoms, conditions, allergies, and medications.

#### Scenario: User submits patient intake
- **WHEN** user submits the patient intake form
- **THEN** system saves the information as patient-provided and prevents automatic AI overwrites.
