/**
 * OpenAI Controller Tests
 * Tests use mocked OpenAI responses - never calls real API
 */

const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const openaiController = require('../src/controllers/openaiController');
const openaiClient = require('../src/services/openai/client');
const sanitizer = require('../src/services/openai/sanitizer');
const openaiLogger = require('../src/services/openai/openaiLogger');

// Mock OpenAI client
jest.mock('../src/services/openai/client');
jest.mock('../src/services/openai/openaiLogger');

describe('OpenAI Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1, role: 'admin' },
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('explainAnomaly', () => {
    it('should sanitize payload before calling OpenAI', async () => {
      mockReq.body = {
        issueType: 'duplicate_voter',
        region: 'Mumbai',
        sample_count: 5,
        aggregated_flags: ['similarity_0.95'],
      };

      const mockResponse = {
        content: JSON.stringify({
          explanation: 'Test explanation',
          confidence: 'high',
          recommended_actions: ['Action 1', 'Action 2'],
        }),
      };

      openaiClient.isAvailable.mockReturnValue(true);
      openaiClient.chatCompletion.mockResolvedValue(mockResponse);
      openaiClient.generateRequestId.mockReturnValue('test-request-id');
      openaiLogger.logCall.mockResolvedValue();

      await openaiController.explainAnomaly(mockReq, mockRes, mockNext);

      expect(sanitizer.redact).toHaveBeenCalled();
      expect(openaiClient.chatCompletion).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          request_id: 'test-request-id',
        })
      );
    });

    it('should reject requests with PII', async () => {
      mockReq.body = {
        issueType: 'duplicate_voter',
        region: 'Mumbai',
        aadhaar_number: '123456789012', // PII!
      };

      sanitizer.validateNoPII.mockReturnValue({ valid: false, reason: 'PII detected' });

      await openaiController.explainAnomaly(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request',
        })
      );
    });

    it('should return 503 if OpenAI not configured', async () => {
      openaiClient.isAvailable.mockReturnValue(false);

      await openaiController.explainAnomaly(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'OpenAI service not configured',
        })
      );
    });
  });

  describe('recommendAction', () => {
    it('should generate recommendations', async () => {
      mockReq.body = {
        issueType: 'duplicate_voter',
        context: 'Multiple similar records',
        severity: 'high',
      };

      const mockResponse = {
        content: JSON.stringify({
          recommended_steps: ['Step 1', 'Step 2'],
          priority: 'high',
        }),
      };

      openaiClient.isAvailable.mockReturnValue(true);
      openaiClient.chatCompletion.mockResolvedValue(mockResponse);
      openaiClient.generateRequestId.mockReturnValue('test-id');
      openaiLogger.logCall.mockResolvedValue();

      await openaiController.recommendAction(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('generateNotice', () => {
    it('should generate multilingual notices', async () => {
      mockReq.body = {
        notice_type: 'election',
        lang: 'hi',
        audience: 'citizens',
        key_points: ['Point 1', 'Point 2'],
      };

      const mockResponse = {
        content: JSON.stringify({
          short_notice: 'Short notice',
          long_notice: 'Long notice',
        }),
      };

      openaiClient.isAvailable.mockReturnValue(true);
      openaiClient.chatCompletion.mockResolvedValue(mockResponse);
      openaiClient.generateRequestId.mockReturnValue('test-id');
      openaiLogger.logCall.mockResolvedValue();

      await openaiController.generateNotice(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});

describe('Data Sanitizer', () => {
  it('should mask Aadhaar numbers', () => {
    const result = sanitizer.maskAadhaar('123456789012');
    expect(result).toBe('XXXX-XXXX-9012');
  });

  it('should mask email addresses', () => {
    const result = sanitizer.maskEmail('john@example.com');
    expect(result).toBe('user@example.com');
  });

  it('should redact names', () => {
    const result = sanitizer.redactName('Ramesh Kumar');
    expect(result).toMatch(/^R\*\*\* \(\d+ chars\)$/);
  });

  it('should convert DOB to age range', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 35;
    const dob = `${birthYear}-05-15`;
    const result = sanitizer.getAgeRange(dob);
    expect(result).toBe('30-39');
  });

  it('should sanitize voter data', () => {
    const voterData = {
      voter_id: 123,
      name: 'John Doe',
      aadhaar_number: '123456789012',
      email: 'john@example.com',
      mobile_number: '9876543210',
    };

    const sanitized = sanitizer.sanitizeVoterData(voterData);
    expect(sanitized.name_redacted).toMatch(/\*\*\*/);
    expect(sanitized.aadhaar_masked).toBe('XXXX-XXXX-9012');
    expect(sanitized.email_masked).toBe('user@example.com');
  });
});

