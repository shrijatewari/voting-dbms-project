# 🚀 Quick Start Guide - AI Services

## Prerequisites

- Python 3.11+
- Node.js 18+ (for backend)
- MySQL (for database)

## Step 1: Install Python Dependencies

```bash
# Install dependencies for all services
cd ai-services/duplicate-engine && pip install -r requirements.txt
cd ../address-engine && pip install -r requirements.txt
cd ../deceased-engine && pip install -r requirements.txt
cd ../document-engine && pip install -r requirements.txt
cd ../forgery-engine && pip install -r requirements.txt
cd ../biometric-engine && pip install -r requirements.txt
```

## Step 2: Run AI Services

### Option A: Individual Services (Development)

Open 6 terminal windows:

```bash
# Terminal 1
cd ai-services/duplicate-engine
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2
cd ai-services/address-engine
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 3
cd ai-services/deceased-engine
uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 4
cd ai-services/document-engine
uvicorn main:app --host 0.0.0.0 --port 8004 --reload

# Terminal 5
cd ai-services/forgery-engine
uvicorn main:app --host 0.0.0.0 --port 8005 --reload

# Terminal 6
cd ai-services/biometric-engine
uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

### Option B: Docker Compose (Recommended)

```bash
cd ai-services
docker-compose up --build
```

## Step 3: Run Database Migration

```bash
cd backend
node src/db/migrate_ai_tables.js
```

## Step 4: Start Node.js Backend

```bash
cd backend
npm install  # Install axios if not already installed
npm start
```

## Step 5: Verify Everything Works

### Test AI Health Check
```bash
curl http://localhost:3000/api/ai/health
```

### Test Duplicate Detection
```bash
curl -X POST http://localhost:3000/api/ai/duplicates/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "record1": {
      "voter_id": 1,
      "name": "Rajesh Kumar",
      "dob": "1990-05-15",
      "aadhaar_number": "123456789012"
    },
    "record2": {
      "voter_id": 2,
      "name": "Rajesh K",
      "dob": "1990-05-15",
      "aadhaar_number": "123456789013"
    }
  }'
```

## Troubleshooting

### Port Already in Use
If a port is already in use, change the port in the service's `main.py` file.

### Import Errors
Make sure all Python dependencies are installed:
```bash
pip install -r requirements.txt
```

### Connection Refused
Ensure all AI services are running before starting the Node.js backend.

### Database Errors
Run the migration script:
```bash
cd backend
node src/db/migrate_ai_tables.js
```

## Next Steps

1. Train ML models with real data
2. Integrate Tesseract OCR for document engine
3. Add authentication between services
4. Set up monitoring and logging
5. Deploy to production

