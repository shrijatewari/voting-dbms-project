const express = require('express');
const router = express.Router();
const pollingStationController = require('../controllers/pollingStationController');

router.post('/', pollingStationController.createStation);
router.get('/', pollingStationController.getAllStations);
router.get('/nearest', pollingStationController.findNearestStation);
router.get('/:id', pollingStationController.getStationById);
router.get('/:id/voter-count', pollingStationController.getStationVoterCount);
router.post('/:id/assign', pollingStationController.assignStationToVoter);

module.exports = router;

