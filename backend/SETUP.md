# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database

Create a `.env` file from the template:
```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voting_system
```

### 3. Create and Setup Database

Make sure MySQL is running, then:
```bash
npm run migrate
```

This will:
- Create the `voting_system` database
- Create all 8 tables with proper relationships
- Set up indexes and constraints

### 4. Seed Sample Data (Optional)

Populate the database with sample data:
```bash
npm run seed
```

This creates:
- 20 voters
- 2 elections
- 10 candidates
- 50 votes
- 5 death records
- 3 duplicate checks
- 30 audit logs

### 5. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 6. Verify Installation

- **Health Check**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api
- **Swagger UI**: http://localhost:3000/api-docs

## Testing the API

### Using cURL

```bash
# Get all voters
curl http://localhost:3000/api/voters

# Create a voter
curl -X POST http://localhost:3000/api/voters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "dob": "1990-01-01",
    "aadhaar_number": "999999999999",
    "biometric_hash": "test_hash_123456789012345678901234567890"
  }'
```

### Using Postman

1. Import `postman_collection.json` into Postman
2. All endpoints are pre-configured
3. Start testing!

## Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check `.env` file has correct credentials
- Ensure database user has CREATE DATABASE privileges

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Migration Errors
- Drop existing database: `DROP DATABASE voting_system;`
- Run `npm run migrate` again

### Reset Everything
```bash
npm run migrate:reset  # Drops all tables
npm run migrate        # Recreates tables
npm run seed           # Populates with sample data
```

## Next Steps

1. ✅ Database is set up
2. ✅ API is running
3. ✅ Sample data is loaded
4. 🎯 Start building your frontend or integrate with existing systems
5. 🔒 Configure JWT authentication if needed
6. 📊 Explore the audit logs and hash-chain verification

---

**Need Help?** Check the main README.md for detailed API documentation.

