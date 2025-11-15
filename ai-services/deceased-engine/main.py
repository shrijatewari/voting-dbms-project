"""Deceased Registry Matching Engine"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Deceased Registry Matcher", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class MatchRequest(BaseModel):
    voter_record: Dict[str, Any]
    death_record: Dict[str, Any]

class MatchResponse(BaseModel):
    match_probability: float
    confidence: float
    reasons: list[str]

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "service": "deceased-engine"}

@app.post("/match-deceased", response_model=MatchResponse)
async def match_deceased(request: MatchRequest):
    try:
        vr = request.voter_record
        dr = request.death_record
        
        # Name similarity
        name1 = vr.get('name', '').lower()
        name2 = dr.get('name', '').lower()
        name_score = 1.0 if name1 == name2 else 0.7 if name1 in name2 or name2 in name1 else 0.0
        
        # DOB match
        dob_match = 1.0 if vr.get('dob') == dr.get('death_date') else 0.0
        
        # Aadhaar partial match
        aad1 = str(vr.get('aadhaar_number', ''))[-4:]
        aad2 = str(dr.get('aadhaar_number', ''))[-4:]
        aad_match = 1.0 if aad1 == aad2 and len(aad1) == 4 else 0.0
        
        # Calculate probability
        prob = (name_score * 0.4 + dob_match * 0.4 + aad_match * 0.2)
        
        reasons = []
        if name_score > 0.7:
            reasons.append("Name match")
        if dob_match == 1.0:
            reasons.append("DOB match")
        if aad_match == 1.0:
            reasons.append("Aadhaar match")
        
        return MatchResponse(
            match_probability=prob,
            confidence=0.9 if len(reasons) >= 2 else 0.6,
            reasons=reasons
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)


