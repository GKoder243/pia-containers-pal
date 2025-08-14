const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Route pour le dashboard Admin
router.get('/admin', authMiddleware(['Admin']), dashboardController.getAdminDashboardData);

// Route pour le dashboard CC
router.get('/cc', authMiddleware(['CC']), dashboardController.getCCDashboardData);

// Route pour le dashboard PIA
router.get('/pia', authMiddleware(['PIA']), dashboardController.getPIADashboardData);

// Route pour récupérer les conteneurs à la PIA en attente de sortie
router.get('/at-pia', authMiddleware(['PIA']), dashboardController.getContainersAtPIA);

module.exports = router;