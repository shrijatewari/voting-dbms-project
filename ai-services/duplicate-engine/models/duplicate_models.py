"""
Pydantic models for duplicate detection service
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class DuplicateRequest(BaseModel):
    """Request model for duplicate prediction"""
    record1: Dict[str, Any] = Field(..., description="First voter record")
    record2: Dict[str, Any] = Field(..., description="Second voter record to compare")

class DuplicateResponse(BaseModel):
    """Response model for duplicate prediction"""
    duplicate_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of being duplicate (0-1)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the prediction")
    features: Dict[str, float] = Field(..., description="Individual feature scores")
    algorithm_flags: list[str] = Field(default_factory=list, description="Algorithms that flagged this as duplicate")
    recommendation: str = Field(..., description="Recommendation: 'merge', 'review', or 'dismiss'")


