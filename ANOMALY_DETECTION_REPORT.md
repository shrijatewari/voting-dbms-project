# 🔍 Anomaly Detection System Report

## Overview

The voting system includes comprehensive anomaly detection that identifies:
- Duplicate voters
- Suspicious voting patterns
- Data integrity issues
- Temporal anomalies

## Detection Methods

### 1. Duplicate Voter Detection

**Checks:**
- ✅ Duplicate Aadhaar numbers (should be impossible due to UNIQUE constraint)
- ✅ Same name + same DOB combinations
- ✅ Identical biometric hashes

**Endpoint:** `GET /api/anomalies/duplicates`

### 2. Suspicious Voting Patterns

**Checks:**
- ✅ Rapid votes (multiple votes within 5 seconds - potential automation)
- ✅ Votes from unverified voters
- ✅ Votes cast outside election time window

**Endpoint:** `GET /api/anomalies/voting-patterns`

### 3. Data Integrity Issues

**Checks:**
- ✅ Broken hash chain in votes table
- ✅ Broken hash chain in audit_logs table
- ✅ Orphaned votes (references to non-existent voters/elections/candidates)
- ✅ Votes from deceased voters (cast after death date)

**Endpoint:** `GET /api/anomalies/integrity`

### 4. Temporal Anomalies

**Checks:**
- ✅ Votes cast at unusual hours (outside 6 AM - 10 PM)
- ✅ Elections with no votes
- ✅ Candidates with no votes

**Endpoint:** `GET /api/anomalies/temporal`

## Full Anomaly Detection

Run all checks at once:

**Endpoint:** `POST /api/anomalies/run-full`

**Response includes:**
- Summary with total anomalies and severity level
- Detailed results from all detection methods
- Timestamp of detection

## Anomaly Statistics

Get quick statistics:

**Endpoint:** `GET /api/anomalies/stats`

**Returns:**
- Unresolved duplicates
- Unverified votes
- Deceased votes
- Old votes

## Severity Levels

- **None:** 0 anomalies
- **Low:** 1-4 anomalies
- **Medium:** 5-19 anomalies
- **High:** 20+ anomalies

## Usage Examples

### Run Full Detection
```bash
curl -X POST http://localhost:3000/api/anomalies/run-full
```

### Check Duplicates Only
```bash
curl http://localhost:3000/api/anomalies/duplicates
```

### Get Statistics
```bash
curl http://localhost:3000/api/anomalies/stats
```

## Integration

The anomaly detection service is integrated with:
- ✅ Duplicate detection service (existing)
- ✅ Hash chain verification
- ✅ Death record sync
- ✅ Audit logging

## Database Normalization Status

✅ **All tables are properly normalized to 3NF**

See `backend/DATABASE_NORMALIZATION_REPORT.md` for detailed analysis.

---

**Status:** Production Ready ✅

