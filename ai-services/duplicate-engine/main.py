"""
AI Duplicate Voter Detection Engine
FastAPI microservice for detecting duplicate voter records using ML and fuzzy matching
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from services.duplicate_service import DuplicateDetectionService
from models.duplicate_models import DuplicateRequest, DuplicateResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Duplicate Detection Engine",
    description="AI-powered duplicate voter detection using ML and fuzzy matching",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to Node.js backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
duplicate_service = DuplicateDetectionService()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "duplicate-detection-engine"
    }

@app.post("/predict-duplicate", response_model=DuplicateResponse)
async def predict_duplicate(request: DuplicateRequest):
    """
    Predict if two voter records are duplicates
    
    Uses:
    - Jaro-Winkler similarity for names
    - Levenshtein distance
    - Soundex/Metaphone phonetic matching
    - DOB matching
    - Address similarity
    - Face embedding similarity (if available)
    - XGBoost ML classifier for final score
    """
    try:
        logger.info(f"Processing duplicate prediction for records: {request.record1.get('voter_id')} vs {request.record2.get('voter_id')}")
        
        result = await duplicate_service.predict_duplicate(
            record1=request.record1,
            record2=request.record2
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in duplicate prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Duplicate prediction failed: {str(e)}")

@app.post("/batch-run")
async def batch_run_duplicate_detection(records: list[Dict[str, Any]], threshold: float = 0.7):
    """
    Run duplicate detection on a batch of records
    
    Returns pairs of potential duplicates with scores above threshold
    """
    try:
        logger.info(f"Running batch duplicate detection on {len(records)} records")
        
        results = await duplicate_service.batch_detect(records, threshold)
        
        return {
            "total_records": len(records),
            "potential_duplicates": len(results),
            "duplicates": results
        }
    except Exception as e:
        logger.error(f"Error in batch duplicate detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch detection failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


