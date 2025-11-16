const voterService = require('../services/voterService');
const { validateVoterRegistration } = require('../middleware/voterValidation');

class VoterController {
  async createVoter(req, res, next) {
    try {
      console.log('Creating voter with data:', {
        email: req.body.email,
        mobile: req.body.mobile_number,
        aadhaar: req.body.aadhaar_number ? req.body.aadhaar_number.substring(0, 4) + '****' : 'missing'
      });
      
      // Validation is done by middleware, but double-check essential fields
      const voter = await voterService.createVoter(req.body);
      res.status(201).json({ 
        success: true, 
        data: voter,
        message: 'Voter registered successfully. Please verify your email and mobile number with OTP.'
      });
    } catch (error) {
      console.error('Voter creation error:', error.message);
      
      // Handle duplicate errors specifically
      if (error.message.includes('already registered') || error.message.includes('Duplicate')) {
        return res.status(409).json({
          error: 'Duplicate registration detected',
          message: error.message,
          details: 'This email/mobile/Aadhaar is already registered in the system. Please contact support if you believe this is an error.'
        });
      }
      next(error);
    }
  }

  async getVoterById(req, res, next) {
    try {
      const voter = await voterService.getVoterById(req.params.id);
      if (!voter) {
        return res.status(404).json({ error: 'Voter not found' });
      }
      res.json({ success: true, data: voter });
    } catch (error) {
      next(error);
    }
  }

  async getAllVoters(req, res, next) {
    try {
      const aadhaar = req.query.aadhaar;
      
      // If Aadhaar search parameter provided, search by Aadhaar
      if (aadhaar) {
        const voter = await voterService.getVoterByAadhaar(aadhaar);
        if (voter) {
          return res.json({ success: true, data: [voter] });
        } else {
          return res.json({ success: true, data: [] });
        }
      }
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await voterService.getAllVoters(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateVoter(req, res, next) {
    try {
      const voter = await voterService.updateVoter(req.params.id, req.body);
      if (!voter) {
        return res.status(404).json({ error: 'Voter not found' });
      }
      res.json({ success: true, data: voter });
    } catch (error) {
      next(error);
    }
  }

  async deleteVoter(req, res, next) {
    try {
      await voterService.deleteVoter(req.params.id);
      res.json({ success: true, message: 'Voter deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyBiometric(req, res, next) {
    try {
      const result = await voterService.verifyBiometric(
        req.body.aadhaar_number,
        req.body.biometric_hash
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoterController();

