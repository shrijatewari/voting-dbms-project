const express = require('express');
const router = express.Router();
const epicController = require('../controllers/epicController');

router.get('/:epicNumber', epicController.getEPICDetails);
router.get('/:epicNumber/download', epicController.downloadEPIC);
router.get('/voter/:voterId/generate', epicController.generateEPICForVoter);

module.exports = router;

