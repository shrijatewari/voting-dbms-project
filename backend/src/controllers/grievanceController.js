const grievanceService = require('../services/grievanceService');

async function createGrievance(req, res, next) {
  try {
    const grievance = await grievanceService.createGrievance(req.body);
    res.status(201).json({ success: true, data: grievance });
  } catch (error) {
    next(error);
  }
}

async function getGrievanceById(req, res, next) {
  try {
    const grievance = await grievanceService.getGrievanceById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' });
    }
    res.json({ success: true, data: grievance });
  } catch (error) {
    next(error);
  }
}

async function getGrievanceByTicket(req, res, next) {
  try {
    const grievance = await grievanceService.getGrievanceByTicket(req.params.ticketNumber);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' });
    }
    res.json({ success: true, data: grievance });
  } catch (error) {
    next(error);
  }
}

async function getAllGrievances(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      status: req.query.status,
      issue_type: req.query.issue_type,
      priority: req.query.priority,
      voter_id: req.query.voter_id
    };
    const result = await grievanceService.getAllGrievances(filters, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function updateGrievance(req, res, next) {
  try {
    const grievance = await grievanceService.updateGrievance(req.params.id, req.body);
    res.json({ success: true, data: grievance });
  } catch (error) {
    next(error);
  }
}

async function reopenGrievance(req, res, next) {
  try {
    const grievance = await grievanceService.reopenGrievance(req.params.id, req.body.reason);
    res.json({ success: true, data: grievance });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGrievance,
  getGrievanceById,
  getGrievanceByTicket,
  getAllGrievances,
  updateGrievance,
  reopenGrievance
};

