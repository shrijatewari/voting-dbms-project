const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Voting DBMS API',
      version: '1.0.0',
      description: 'Tamper-Proof Biometric Voter Verification & Audit System API Documentation',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Voter: {
          type: 'object',
          required: ['name', 'dob', 'aadhaar_number', 'biometric_hash'],
          properties: {
            voter_id: { type: 'integer' },
            name: { type: 'string', example: 'John Doe' },
            dob: { type: 'string', format: 'date', example: '1990-01-15' },
            aadhaar_number: { type: 'string', pattern: '^\\d{12}$', example: '123456789012' },
            biometric_hash: { type: 'string', minLength: 32 },
            is_verified: { type: 'boolean', default: false },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Election: {
          type: 'object',
          required: ['title', 'start_date', 'end_date'],
          properties: {
            election_id: { type: 'integer' },
            title: { type: 'string', example: '2024 General Election' },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['upcoming', 'active', 'completed', 'cancelled'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Candidate: {
          type: 'object',
          required: ['election_id', 'name'],
          properties: {
            candidate_id: { type: 'integer' },
            election_id: { type: 'integer' },
            name: { type: 'string', example: 'Jane Smith' },
            manifesto: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Vote: {
          type: 'object',
          required: ['voter_id', 'candidate_id', 'election_id'],
          properties: {
            vote_id: { type: 'integer' },
            voter_id: { type: 'integer' },
            candidate_id: { type: 'integer' },
            election_id: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
            previous_hash: { type: 'string' },
            current_hash: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

