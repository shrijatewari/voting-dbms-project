# AI Services - Election Roll Management System

Complete AI backend microservices for government-grade election roll management.

## Architecture

This directory contains 6 independent FastAPI microservices:

1. **Duplicate Detection Engine** (Port 8001)
2. **Address Intelligence Engine** (Port 8002)
3. **Deceased Registry Matcher** (Port 8003)
4. **Document OCR + Verification** (Port 8004)
5. **Forgery Detection Engine** (Port 8005)
6. **Biometric Matching Engine** (Port 8006)

## Quick Start

### Prerequisites
- Python 3.11+
- Docker (optional)

### Running Services

#### Development Mode
```bash
# Duplicate Engine
cd duplicate-engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Address Engine
cd address-engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# ... repeat for other services
```

#### Docker Mode
```bash
# Build and run all services
docker-compose up --build
```

## Integration with Node.js Backend

The main Express.js backend calls these services via HTTP. See `backend/src/services/aiClient.js` for the integration client.

## API Endpoints

### Duplicate Detection
- `POST /predict-duplicate` - Predict if two records are duplicates
- `POST /batch-run` - Batch duplicate detection

### Address Intelligence
- `POST /normalize` - Normalize address
- `POST /fraud-detect` - Detect fraudulent addresses
- `POST /cluster-analysis` - Analyze address clusters

### Deceased Matching
- `POST /match-deceased` - Match voter with death record

### Document Verification
- `POST /verify-document` - OCR + fake document detection

### Forgery Detection
- `POST /verify-notice` - Verify official notices/communications

### Biometric Matching
- `POST /match-face` - Match face embeddings
- `POST /match-fingerprint` - Match fingerprint templates

## Health Checks

All services expose `/health` endpoint for monitoring.

## Environment Variables

Set these in `.env` files for each service:
- `AI_SERVICE_PORT` - Port number
- `LOG_LEVEL` - Logging level (INFO, DEBUG, etc.)

## Production Deployment

1. Use Docker Compose for orchestration
2. Set up reverse proxy (nginx) for load balancing
3. Configure environment variables
4. Enable HTTPS
5. Set up monitoring and logging

## Model Training

For production, train ML models using:
- XGBoost for duplicate detection
- CNN for document forgery detection
- Face recognition models for biometric matching

See individual service READMEs for model training instructions.


