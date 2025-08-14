const pool = require('../config/db');
exports.getAllCheckpoints = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [checkpoints] = await connection.query('SELECT id, nom FROM checkpoint');
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) connection.release();
  }
};