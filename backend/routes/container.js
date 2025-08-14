const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const authMiddleware = require('../middleware/authMiddleware');

// La route est PUT /:containerId/validate-exit
router.put('/:containerId/validate-exit', authMiddleware(['CC']), containerController.validateContainerExit);

// Route pour valider l'arrivée : PUT /api/containers/123/validate-arrival
router.put('/:containerId/validate-arrival', authMiddleware(['PIA']), containerController.validateContainerArrival);

// Route pour valider la sortie de la PIA
router.put('/:containerId/validate-departure', authMiddleware(['PIA']), containerController.validatePIADeparture);

module.exports = router;