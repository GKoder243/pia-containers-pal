const express = require('express');
const router = express.Router();
const checkpointController = require('../controllers/checkpointController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware(['Admin']), checkpointController.getAllCheckpoints);

module.exports = router;