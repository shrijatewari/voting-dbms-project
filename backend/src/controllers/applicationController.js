const applicationService = require('../services/applicationService');

async function getApplication(req, res, next) {
  try {
    const { includeHistory } = req.query;
    
    // If history is requested, use optimized combined query
    if (includeHistory === 'true') {
      const result = await applicationService.getApplicationWithHistory(req.params.applicationId);
      if (!result.application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      return res.json({ 
        success: true, 
        data: result.application,
        trackingHistory: result.trackingHistory
      });
    }
    
    // Otherwise, just get application
    const application = await applicationService.getApplicationByID(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

async function getTrackingHistory(req, res, next) {
  try {
    const history = await applicationService.getTrackingHistory(req.params.applicationId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }
    const changedBy = req.user?.user_id || null; // From auth middleware
    await applicationService.updateStatus(req.params.applicationId, status, changedBy, remarks);
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getApplication,
  getTrackingHistory,
  updateStatus
};

