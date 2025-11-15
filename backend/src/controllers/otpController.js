const otpService = require('../services/otpService');

async function sendAadhaarOTP(req, res, next) {
  try {
    const { aadhaar_number } = req.body;
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({ error: 'Valid Aadhaar number required' });
    }
    const result = await otpService.sendAadhaarOTP(aadhaar_number);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function sendEmailOTP(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    const result = await otpService.sendEmailOTP(email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function sendMobileOTP(req, res, next) {
  try {
    const { mobile_number } = req.body;
    if (!mobile_number || mobile_number.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
    }
    const result = await otpService.sendMobileOTP(mobile_number);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function verifyOTP(req, res, next) {
  try {
    const { identifier, otp_type, otp_code } = req.body;
    if (!identifier || !otp_type || !otp_code) {
      return res.status(400).json({ error: 'identifier, otp_type, and otp_code required' });
    }
    const result = await otpService.verifyOTP(identifier, otp_type, otp_code);
    res.json({ success: result.verified, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendAadhaarOTP,
  sendEmailOTP,
  sendMobileOTP,
  verifyOTP
};

