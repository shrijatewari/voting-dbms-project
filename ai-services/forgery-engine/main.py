"""Forgery Detection Engine for Official Notices"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging
import hashlib
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Forgery Detection Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class VerifyRequest(BaseModel):
    document_base64: str
    original_hash: Optional[str] = None

class VerifyResponse(BaseModel):
    is_forged: bool
    confidence: float
    hash_match: bool
    anomalies: list[str]

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "service": "forgery-engine"}

@app.post("/verify-notice", response_model=VerifyResponse)
async def verify_notice(request: VerifyRequest):
    try:
        # Calculate hash of document
        doc_hash = hashlib.sha256(request.document_base64.encode()).hexdigest()
        
        # Compare with original hash
        hash_match = request.original_hash and doc_hash == request.original_hash
        
        anomalies = []
        if not hash_match and request.original_hash:
            anomalies.append("Document hash mismatch - possible tampering")
        
        # Additional checks (placeholder)
        if len(request.document_base64) < 100:
            anomalies.append("Document too small - suspicious")
        
        is_forged = not hash_match or len(anomalies) > 0
        
        return VerifyResponse(
            is_forged=is_forged,
            confidence=0.95 if hash_match else 0.3,
            hash_match=hash_match,
            anomalies=anomalies
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)


