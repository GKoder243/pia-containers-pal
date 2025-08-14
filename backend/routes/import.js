const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/authMiddleware');

// Configuration de Multer pour stocker le fichier en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route pour pré-visualiser le fichier et récupérer les en-têtes
// Elle attend un champ nommé 'excelFile' dans la requête multipart/form-data
router.post('/preview', authMiddleware(['Admin']), upload.single('excelFile'), importController.previewUpload);

// Route pour traiter le fichier avec le mapping fourni
// Elle attend un champ 'excelFile' et un champ 'mapping'
router.post('/process', authMiddleware(['Admin']), upload.single('excelFile'), importController.processUpload);

module.exports = router;
