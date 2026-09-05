## Purpose

Deterministically evaluates lab values against source-provided reference ranges to classify them as LOW, NORMAL, HIGH, or UNKNOWN.

## ADDED Requirements

### Requirement: Reference Range Evaluation
The system SHALL evaluate lab values strictly against the reference range provided in the original source document, without relying on external typical ranges or AI intuition.

#### Scenario: Lab value outside reference range
- **WHEN** a lab value is extracted along with a reference range, and the value is below the lower bound
- **THEN** the system deterministically flags the status as LOW.
