const pool = require('../config/database');
const crypto = require('crypto');

/**
 * OTP Service
 * Handles OTP generation and verification for Aadhaar, Email, Mobile
 */
class OTPService {
  /**
   * Generate 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create OTP
   */
  async createOTP(identifier, otpType, expiresInMinutes = 10) {
    const connection = await pool.getConnection();
    try {
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      // Invalidate previous OTPs for this identifier
      await connection.query(
        'UPDATE otp_verifications SET is_used = TRUE WHERE identifier = ? AND otp_type = ? AND is_used = FALSE',
        [identifier, otpType]
      );

      // Create new OTP
      const [result] = await connection.query(
        `INSERT INTO otp_verifications (identifier, otp_type, otp_code, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [identifier, otpType, otpCode, expiresAt]
      );

      // In production, send OTP via SMS/Email
      // For now, we'll return it (in production, don't return it)
      return {
        otp_id: result.insertId,
        otp_code: otpCode, // Remove this in production
        expires_at: expiresAt
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(identifier, otpType, otpCode) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM otp_verifications 
         WHERE identifier = ? AND otp_type = ? AND otp_code = ? 
         AND is_used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [identifier, otpType, otpCode]
      );

      if (rows.length === 0) {
        return { verified: false, message: 'Invalid or expired OTP' };
      }

      // Mark as used
      await connection.query(
        'UPDATE otp_verifications SET is_used = TRUE, verified_at = NOW() WHERE otp_id = ?',
        [rows[0].otp_id]
      );

      return { verified: true, message: 'OTP verified successfully' };
    } finally {
      connection.release();
    }
  }

  /**
   * Send OTP via Aadhaar (mock - in production use UIDAI API)
   */
  async sendAadhaarOTP(aadhaarNumber) {
    // In production: Call UIDAI API to send OTP
    // For now: Just create OTP record
    return await this.createOTP(aadhaarNumber, 'aadhaar');
  }

  /**
   * Send OTP via Email (mock - in production use email service)
   */
  async sendEmailOTP(email) {
    // In production: Send email via SendGrid, AWS SES, etc.
    const result = await this.createOTP(email, 'email');
    console.log(`[MOCK] Email OTP sent to ${email}: ${result.otp_code}`);
    return result;
  }

  /**
   * Send OTP via SMS (mock - in production use SMS gateway)
   */
  async sendMobileOTP(mobileNumber) {
    // In production: Send SMS via Twilio, AWS SNS, etc.
    const result = await this.createOTP(mobileNumber, 'mobile');
    console.log(`[MOCK] SMS OTP sent to ${mobileNumber}: ${result.otp_code}`);
    return result;
  }
}

module.exports = new OTPService();

