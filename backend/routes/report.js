const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// Seuls les Admins peuvent voir les rapports
router.get('/', authMiddleware(['Admin']), reportController.getMovementHistory);
router.get('/container/:numeroConteneur', authMiddleware(['Admin']), reportController.getContainerDetails);

module.exports = router;
