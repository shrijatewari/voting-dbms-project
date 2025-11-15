const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

router.post('/send/aadhaar', otpController.sendAadhaarOTP);
router.post('/send/email', otpController.sendEmailOTP);
router.post('/send/mobile', otpController.sendMobileOTP);
router.post('/verify', otpController.verifyOTP);

module.exports = router;

