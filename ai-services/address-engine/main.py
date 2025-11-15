"""
AI Address Normalization + Fraud Detection Engine
FastAPI microservice for address processing and fraud detection
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime

from services.address_service import AddressService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Address Intelligence Engine",
    description="Address normalization and fraud detection using NLP and ML",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

address_service = AddressService()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str

class AddressRequest(BaseModel):
    address: Dict[str, Any]

class NormalizeResponse(BaseModel):
    normalized_address: Dict[str, Any]
    confidence: float

class FraudDetectResponse(BaseModel):
    is_fraud: bool
    risk_score: float
    reasons: List[str]
    cluster_id: Optional[str] = None

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "address-engine"
    }

@app.post("/normalize", response_model=NormalizeResponse)
async def normalize_address(request: AddressRequest):
    """Normalize address using NLP"""
    try:
        result = await address_service.normalize(request.address)
        return result
    except Exception as e:
        logger.error(f"Error normalizing address: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fraud-detect", response_model=FraudDetectResponse)
async def detect_fraud(request: AddressRequest):
    """Detect fraudulent addresses"""
    try:
        result = await address_service.detect_fraud(request.address)
        return result
    except Exception as e:
        logger.error(f"Error detecting fraud: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cluster-analysis")
async def cluster_analysis(addresses: List[Dict[str, Any]]):
    """Analyze address clusters for ghost houses"""
    try:
        result = await address_service.analyze_clusters(addresses)
        return result
    except Exception as e:
        logger.error(f"Error in cluster analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)


