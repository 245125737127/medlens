## Purpose

Generates a patient-friendly summary strictly from the structured record without diagnosing, recommending treatments, or prescribing.

## ADDED Requirements

### Requirement: Safe Patient Summary
The system SHALL generate a concise, patient-friendly summary that explains the structured medical record without acting as a medical diagnosis or treatment recommendation.

#### Scenario: User views patient summary
- **WHEN** the dashboard loads the AI summary
- **THEN** the text only references extracted facts and source-provided reference ranges, and includes a safety notice that it does not provide medical advice.
