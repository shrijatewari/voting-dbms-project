const express = require('express');
const router = express.Router();
const biometricController = require('../controllers/biometricController');

// POST /biometric/register
router.post('/register', biometricController.registerBiometric);

// POST /biometric/verify
router.post('/verify', biometricController.verifyBiometric);

// POST /biometric/find-matches
router.post('/find-matches', biometricController.findMatches);

// POST /biometric/extract-face
router.post('/extract-face', biometricController.extractFaceFeatures);

// POST /biometric/extract-fingerprint
router.post('/extract-fingerprint', biometricController.extractFingerprintMinutiae);

// POST /biometric/face/register
router.post('/face/register', biometricController.registerFace);

// POST /biometric/fingerprint/register
router.post('/fingerprint/register', biometricController.registerFingerprint);

// POST /biometric/face/verify
router.post('/face/verify', biometricController.verifyFace);

// POST /biometric/fingerprint/verify
router.post('/fingerprint/verify', biometricController.verifyFingerprint);

module.exports = router;

