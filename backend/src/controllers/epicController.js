const epicService = require('../services/epicService');

async function getEPICDetails(req, res, next) {
  try {
    const epic = await epicService.getEPICDetails(req.params.epicNumber);
    if (!epic) {
      return res.status(404).json({ error: 'EPIC not found' });
    }
    res.json({ success: true, data: epic });
  } catch (error) {
    next(error);
  }
}

async function downloadEPIC(req, res, next) {
  try {
    const epicData = await epicService.downloadEPIC(req.params.epicNumber);
    // In production, generate actual PDF and send it
    // For now, return JSON that frontend can use
    res.json({ success: true, data: epicData });
  } catch (error) {
    next(error);
  }
}

async function generateEPICForVoter(req, res, next) {
  try {
    const epicData = await epicService.generateEPICPDF(parseInt(req.params.voterId));
    res.json({ success: true, data: epicData });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEPICDetails,
  downloadEPIC,
  generateEPICForVoter
};

