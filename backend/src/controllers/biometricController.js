const biometricService = require('../services/biometricService');

class BiometricController {
  async registerBiometric(req, res, next) {
    try {
      const { voter_id, face_data, fingerprint_data } = req.body;
      
      if (!voter_id || !face_data || !fingerprint_data) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, face_data, fingerprint_data'
        });
      }

      const result = await biometricService.registerBiometric(
        voter_id,
        face_data,
        fingerprint_data
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyBiometric(req, res, next) {
    try {
      const { voter_id, face_data, fingerprint_data } = req.body;
      
      if (!voter_id || !face_data || !fingerprint_data) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, face_data, fingerprint_data'
        });
      }

      const result = await biometricService.verifyBiometric(
        voter_id,
        face_data,
        fingerprint_data
      );

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findMatches(req, res, next) {
    try {
      const { face_data, fingerprint_data, threshold } = req.body;
      
      if (!face_data || !fingerprint_data) {
        return res.status(400).json({
          error: 'Missing required fields: face_data, fingerprint_data'
        });
      }

      const result = await biometricService.findBiometricMatches(
        face_data,
        fingerprint_data,
        threshold || 80
      );

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async extractFaceFeatures(req, res, next) {
    try {
      const { image_base64 } = req.body;
      
      if (!image_base64) {
        return res.status(400).json({ error: 'Missing image_base64' });
      }

      const result = await biometricService.extractFaceFeatures(image_base64);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async extractFingerprintMinutiae(req, res, next) {
    try {
      const { fingerprint_base64 } = req.body;
      
      if (!fingerprint_base64) {
        return res.status(400).json({ error: 'Missing fingerprint_base64' });
      }

      const result = await biometricService.extractFingerprintMinutiae(fingerprint_base64);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async registerFace(req, res, next) {
    try {
      const { voter_id, face_embedding, face_hash, liveness_passed } = req.body;
      
      if (!voter_id || !face_embedding || !face_hash) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, face_embedding, face_hash'
        });
      }

      const result = await biometricService.registerFace(
        voter_id,
        face_embedding,
        face_hash,
        liveness_passed || false
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async registerFingerprint(req, res, next) {
    try {
      const { voter_id, fingerprint_template, fingerprint_hash } = req.body;
      
      if (!voter_id || !fingerprint_template || !fingerprint_hash) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, fingerprint_template, fingerprint_hash'
        });
      }

      const result = await biometricService.registerFingerprint(
        voter_id,
        fingerprint_template,
        fingerprint_hash
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyFace(req, res, next) {
    try {
      const { voter_id, face_embedding } = req.body;
      
      if (!voter_id || !face_embedding) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, face_embedding'
        });
      }

      const result = await biometricService.verifyFace(voter_id, face_embedding);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async verifyFingerprint(req, res, next) {
    try {
      const { voter_id, fingerprint_template } = req.body;
      
      if (!voter_id || !fingerprint_template) {
        return res.status(400).json({
          error: 'Missing required fields: voter_id, fingerprint_template'
        });
      }

      const result = await biometricService.verifyFingerprint(voter_id, fingerprint_template);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BiometricController();

