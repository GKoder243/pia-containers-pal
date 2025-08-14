const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (allowedRoles) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé, token manquant ou malformé' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.id, role: decoded.role, checkpointId: decoded.checkpointId };
    if (allowedRoles && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé, rôle non autorisé' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = authMiddleware;