# Duplicate Detection Engine

AI-powered microservice for detecting duplicate voter records using ML and fuzzy matching algorithms.

## Features

- **Fuzzy String Matching**: Jaro-Winkler, Levenshtein, Soundex, Metaphone
- **ML Classification**: XGBoost/RandomForest for duplicate probability prediction
- **Multi-feature Analysis**: Name, DOB, Address, Phone, Aadhaar, Face embeddings
- **Batch Processing**: Process multiple records at once

## API Endpoints

### Health Check
```
GET /health
```

### Predict Duplicate
```
POST /predict-duplicate
Body: {
  "record1": {...},
  "record2": {...}
}
```

### Batch Detection
```
POST /batch-run
Body: {
  "records": [...],
  "threshold": 0.7
}
```

## Running the Service

### Development
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Docker
```bash
docker build -t duplicate-engine .
docker run -p 8001:8001 duplicate-engine
```

## Integration

This service is called by the main Node.js backend via HTTP requests.


