const endToEndVerificationService = require('../services/endToEndVerificationService');

class EndToEndVerificationController {
  async generateVoteReference(req, res, next) {
    try {
      const voteId = parseInt(req.params.vote_id);
      const reference = await endToEndVerificationService.generateVoteReference(voteId);
      if (!reference) {
        return res.status(404).json({ error: 'Vote not found' });
      }
      res.json({ success: true, data: reference });
    } catch (error) {
      next(error);
    }
  }

  async verifyVoteReference(req, res, next) {
    try {
      const referenceCode = req.params.reference_code;
      const verification = await endToEndVerificationService.verifyVoteReference(referenceCode);
      res.json({ success: true, data: verification });
    } catch (error) {
      next(error);
    }
  }

  async generateElectionProof(req, res, next) {
    try {
      const electionId = parseInt(req.params.election_id);
      const proof = await endToEndVerificationService.generateElectionProof(electionId);
      res.json({ success: true, data: proof });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EndToEndVerificationController();

