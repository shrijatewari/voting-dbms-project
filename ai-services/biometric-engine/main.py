"""Biometric Matching Engine (Face + Fingerprint)"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import logging
import numpy as np
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Biometric Matching Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class MatchRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]

class MatchResponse(BaseModel):
    match_probability: float
    similarity_score: float
    confidence: float

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "service": "biometric-engine"}

@app.post("/match-face", response_model=MatchResponse)
async def match_face(request: MatchRequest):
    try:
        emb1 = np.array(request.embedding1)
        emb2 = np.array(request.embedding2)
        
        # Normalize
        emb1_norm = emb1 / (np.linalg.norm(emb1) + 1e-8)
        emb2_norm = emb2 / (np.linalg.norm(emb2) + 1e-8)
        
        # Cosine similarity
        similarity = float(np.dot(emb1_norm, emb2_norm))
        similarity = max(0.0, min(1.0, similarity))
        
        # Convert to probability
        prob = similarity ** 2  # Square to make it more conservative
        
        return MatchResponse(
            match_probability=prob,
            similarity_score=similarity,
            confidence=0.9 if similarity > 0.9 else 0.7
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-fingerprint", response_model=MatchResponse)
async def match_fingerprint(request: MatchRequest):
    try:
        # Similar logic to face matching
        template1 = np.array(request.embedding1)
        template2 = np.array(request.embedding2)
        
        # Normalize
        t1_norm = template1 / (np.linalg.norm(template1) + 1e-8)
        t2_norm = template2 / (np.linalg.norm(template2) + 1e-8)
        
        # Cosine similarity
        similarity = float(np.dot(t1_norm, t2_norm))
        similarity = max(0.0, min(1.0, similarity))
        
        # Fingerprint matching is typically more strict
        prob = similarity ** 1.5
        
        return MatchResponse(
            match_probability=prob,
            similarity_score=similarity,
            confidence=0.95 if similarity > 0.85 else 0.6
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)


