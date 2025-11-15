const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');

router.post('/', grievanceController.createGrievance);
router.get('/', grievanceController.getAllGrievances);
router.get('/ticket/:ticketNumber', grievanceController.getGrievanceByTicket);
router.get('/:id', grievanceController.getGrievanceById);
router.put('/:id', grievanceController.updateGrievance);
router.post('/:id/reopen', grievanceController.reopenGrievance);

module.exports = router;

