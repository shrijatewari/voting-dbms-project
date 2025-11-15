"""Document OCR + Fake Document Detector"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import re
import base64
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Document Verification Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class VerifyRequest(BaseModel):
    document_base64: str
    document_type: str

class VerifyResponse(BaseModel):
    is_fake: bool
    confidence: float
    ocr_data: Dict[str, Any]
    validation_errors: list[str]

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "service": "document-engine"}

@app.post("/verify-document", response_model=VerifyResponse)
async def verify_document(request: VerifyRequest):
    try:
        # Decode base64 (placeholder - in production, use Tesseract OCR)
        doc_data = base64.b64decode(request.document_base64[:100])  # Sample
        
        errors = []
        ocr_data = {}
        
        # Validate document type
        if request.document_type == "aadhaar":
            # Check Aadhaar format (12 digits)
            # In production, extract via OCR and validate
            ocr_data = {"name": "Extracted Name", "dob": "1990-01-01", "aadhaar": "123456789012"}
        elif request.document_type == "pan":
            # PAN format: ABCDE1234F
            ocr_data = {"name": "Extracted Name", "pan": "ABCDE1234F"}
        
        # Fake detection (simplified)
        is_fake = len(errors) > 0 or len(doc_data) < 100  # Placeholder logic
        
        return VerifyResponse(
            is_fake=is_fake,
            confidence=0.85 if not is_fake else 0.3,
            ocr_data=ocr_data,
            validation_errors=errors
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)


