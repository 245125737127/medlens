import pytest
from document_processor import evaluate_reference_range

def test_evaluate_reference_range_empty():
    assert evaluate_reference_range(5.0, "") == "UNKNOWN"
    assert evaluate_reference_range(5.0, None) == "UNKNOWN"

def test_evaluate_reference_range_less_than():
    assert evaluate_reference_range(4.0, "< 5.0") == "NORMAL"
    assert evaluate_reference_range(5.0, "< 5.0") == "HIGH"
    assert evaluate_reference_range(6.0, "<5") == "HIGH"

def test_evaluate_reference_range_greater_than():
    assert evaluate_reference_range(6.0, "> 5.0") == "NORMAL"
    assert evaluate_reference_range(5.0, "> 5.0") == "LOW"
    assert evaluate_reference_range(4.0, ">5") == "LOW"

def test_evaluate_reference_range_min_max():
    # Normal cases
    assert evaluate_reference_range(5.0, "4.0-6.0") == "NORMAL"
    assert evaluate_reference_range(5.0, "4.0 to 6.0") == "NORMAL"
    assert evaluate_reference_range(5.0, "4.0 - 6.0") == "NORMAL"
    
    # Low cases
    assert evaluate_reference_range(3.0, "4.0-6.0") == "LOW"
    
    # High cases
    assert evaluate_reference_range(7.0, "4.0-6.0") == "HIGH"
    
    # Boundary cases
    assert evaluate_reference_range(4.0, "4.0-6.0") == "NORMAL"
    assert evaluate_reference_range(6.0, "4.0-6.0") == "NORMAL"
    
    # Flipped ranges
    assert evaluate_reference_range(5.0, "6.0-4.0") == "NORMAL"

def test_evaluate_reference_range_malformed():
    assert evaluate_reference_range(5.0, "abc") == "UNKNOWN"
    assert evaluate_reference_range(5.0, "<") == "UNKNOWN"
    assert evaluate_reference_range(5.0, ">") == "UNKNOWN"
    assert evaluate_reference_range(5.0, "13") == "UNKNOWN"
