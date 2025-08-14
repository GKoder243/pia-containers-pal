const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Seul un Admin peut gérer les utilisateurs
router.post('/', authMiddleware(['Admin']), userController.createUser);
router.get('/', authMiddleware(['Admin']), userController.getUsers);
router.put('/:id', authMiddleware(['Admin']), userController.updateUser);
router.delete('/:id', authMiddleware(['Admin']), userController.deleteUser);

module.exports = router;
