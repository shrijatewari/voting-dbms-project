const { z } = require('zod');

// Voter validation schemas - biometric_hash is handled in service layer, not validated here
const voterSchema = z.object({
  name: z.string().min(2).max(255),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aadhaar_number: z.string().length(12).regex(/^\d{12}$/),
  is_verified: z.boolean().optional()
}).passthrough(); // Allow biometric_hash and other fields to pass through without validation

const biometricVerificationSchema = z.object({
  aadhaar_number: z.string().length(12).regex(/^\d{12}$/),
  biometric_hash: z.string().min(32)
});

// Election validation schemas
const electionSchema = z.object({
  title: z.string().min(3).max(255),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional()
});

// Candidate validation schemas
const candidateSchema = z.object({
  election_id: z.number().int().positive(),
  name: z.string().min(2).max(255),
  manifesto: z.string().optional()
});

// Vote validation schemas
const voteSchema = z.object({
  voter_id: z.number().int().positive(),
  candidate_id: z.number().int().positive(),
  election_id: z.number().int().positive()
});

// Death record validation schemas
const deathRecordSchema = z.object({
  aadhaar_number: z.string().length(12).regex(/^\d{12}$/),
  death_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Duplicate check resolution schema
const duplicateResolutionSchema = z.object({
  resolved: z.boolean(),
  note: z.string().optional()
});

// Validation middleware factory
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

module.exports = {
  voterSchema,
  biometricVerificationSchema,
  electionSchema,
  candidateSchema,
  voteSchema,
  deathRecordSchema,
  duplicateResolutionSchema,
  validate
};

