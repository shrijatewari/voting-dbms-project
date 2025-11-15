# 🗳️ Voting DBMS Backend - Tamper-Proof Biometric Voter Verification & Audit System

A production-grade backend system for managing elections, voters, candidates, and votes with cryptographic hash-chain audit logging, duplicate detection, and death record verification.

## ✨ Features

- ✅ **Full CRUD Operations** for Voters, Elections, Candidates, and Votes
- ✅ **Hash-Chain Audit Logging** - Tamper-proof cryptographic audit trail
- ✅ **Biometric Verification** - Voter identity verification using biometric hashes
- ✅ **Duplicate Detection** - Automatic detection of duplicate voter records
- ✅ **Death Record Sync** - Cross-verification with death records to prevent deceased voting
- ✅ **Election Results** - Real-time vote counting and results
- ✅ **RESTful API** - Clean, well-documented REST endpoints
- ✅ **Input Validation** - Zod-based request validation
- ✅ **Error Handling** - Comprehensive error handling middleware
- ✅ **MySQL Database** - Fully normalized (3NF/BCNF) database schema

## 🏗️ Database Schema

The system uses 8 normalized tables:

1. **voters** - Voter information with biometric data
2. **elections** - Election details and status
3. **candidates** - Candidate information per election
4. **candidate_manifestos** - Versioned candidate manifestos
5. **votes** - Votes with hash-chain implementation
6. **death_records** - Death record registry
7. **duplicate_checks** - Duplicate voter detection results
8. **audit_logs** - Hash-chain audit trail

All tables are properly normalized to 3NF/BCNF with foreign key constraints, indexes, and check constraints.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone/Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=voting_system
   
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=24h
   
   PORT=3000
   NODE_ENV=development
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

6. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Voters

- `POST /voters` - Create a new voter
- `GET /voters` - Get all voters (paginated)
- `GET /voters/:id` - Get voter by ID
- `PUT /voters/:id` - Update voter
- `DELETE /voters/:id` - Delete voter
- `POST /voters/verify-biometric` - Verify voter biometric

### Elections

- `POST /elections` - Create a new election
- `GET /elections` - Get all elections (paginated)
- `GET /elections/:id` - Get election by ID
- `PUT /elections/:id` - Update election
- `DELETE /elections/:id` - Delete election

### Candidates

- `POST /candidates` - Create a new candidate
- `GET /candidates` - Get all candidates (optional `?election_id=` filter)
- `GET /candidates/:id` - Get candidate by ID
- `PUT /candidates/:id` - Update candidate
- `DELETE /candidates/:id` - Delete candidate

### Votes

- `POST /votes` - Cast a vote (with hash-chain)
- `GET /votes/:id` - Get vote by ID
- `GET /votes/election/:election_id` - Get votes by election
- `GET /votes/election/:election_id/results` - Get election results
- `GET /votes/verify-chain` - Verify vote hash-chain integrity

### Duplicate Detection

- `POST /duplicates/run` - Run duplicate detection
- `GET /duplicates` - Get all duplicate checks (optional `?resolved=true/false`)
- `PUT /duplicates/:id/resolve` - Resolve a duplicate check

### Death Records

- `POST /death-records` - Create a death record
- `POST /death-records/sync/run` - Run death record sync
- `GET /death-records` - Get all death records (paginated)

### Audit Logs

- `GET /audit-logs` - Get audit logs with filters:
  - `?entity_type=` - Filter by entity type
  - `?action_type=` - Filter by action type
  - `?voter_id=` - Filter by voter ID
  - `?election_id=` - Filter by election ID
  - `?start_date=` - Filter by start date
  - `?end_date=` - Filter by end date
- `GET /audit-logs/verify-chain` - Verify audit log hash-chain integrity

### Other Endpoints

- `GET /health` - Health check
- `GET /api` - API documentation

## 📝 Example API Requests

### Create a Voter
```bash
curl -X POST http://localhost:3000/api/voters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "dob": "1990-01-15",
    "aadhaar_number": "123456789012",
    "biometric_hash": "abc123def456...",
    "is_verified": false
  }'
```

### Create an Election
```bash
curl -X POST http://localhost:3000/api/elections \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2024 General Election",
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-06-02T23:59:59Z",
    "status": "active"
  }'
```

### Cast a Vote
```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "voter_id": 1,
    "candidate_id": 1,
    "election_id": 1
  }'
```

### Run Duplicate Detection
```bash
curl -X POST http://localhost:3000/api/duplicates/run
```

## 🔐 Hash-Chain Implementation

The system implements a cryptographic hash-chain for both votes and audit logs:

- Each vote/audit log entry includes:
  - `previous_hash` - Hash of the previous entry
  - `current_hash` - SHA-256 hash of: `previous_hash + data + timestamp`

- Hash verification endpoints:
  - `GET /api/votes/verify-chain` - Verify vote hash-chain
  - `GET /api/audit-logs/verify-chain` - Verify audit log hash-chain

This ensures tamper-proof integrity of all voting and audit data.

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/             # Request handlers
│   ├── db/
│   │   ├── migrate.js           # Database migrations
│   │   └── seed.js              # Database seeding
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── auditLog.js          # Audit logging middleware
│   │   └── errorHandler.js      # Error handling
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   ├── utils/
│   │   ├── hashChain.js         # Hash-chain utilities
│   │   └── validation.js        # Zod schemas
│   └── server.js                # Express app setup
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

## 🧪 Testing

After seeding the database, you can test the API using:

1. **Postman** - Import the provided Postman collection
2. **cURL** - Use the examples above
3. **Browser** - Visit `http://localhost:3000/api` for documentation

## 🔧 Database Management

### Reset Database
```bash
npm run migrate:reset
```

This will drop all tables and recreate them.

### Re-seed Database
```bash
npm run seed
```

This will clear existing data and populate with fresh sample data.

## 📊 Sample Data

The seed script creates:
- 20 voters with unique Aadhaar numbers
- 2 elections
- 10 candidates (5 per election)
- 50 votes with valid hash-chain
- 5 death records
- 3 duplicate flags
- 30 audit log entries

## 🛡️ Security Features

- Input validation using Zod schemas
- SQL injection prevention (parameterized queries)
- Hash-chain tamper detection
- Death record verification
- Duplicate voter detection
- Comprehensive audit logging

## 📚 Additional Resources

- **API Documentation**: Visit `http://localhost:3000/api` when server is running
- **Postman Collection**: See `postman_collection.json`
- **Database Schema**: See migration files in `src/db/migrate.js`

## 🤝 Contributing

This is a complete, production-ready backend system. Feel free to extend it with:
- Additional validation rules
- More sophisticated duplicate detection algorithms
- Enhanced biometric verification
- Real-time vote counting
- Advanced reporting features

## 📄 License

MIT

---

**Built with ❤️ for secure, transparent voting systems**

