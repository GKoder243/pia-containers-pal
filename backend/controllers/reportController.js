const pool = require('../config/db');

exports.getMovementHistory = async (req, res) => {
  const { search, date } = req.query; // Récupère les paramètres de l'URL
  let connection;

  try {
    let sql = `
      SELECT 
        m.id, m.date_heure, m.matricule_camion,
        co.numero_conteneur, u.nom as nom_agent, ch.nom as nom_checkpoint
      FROM mouvement m
      JOIN conteneur co ON m.conteneur_id = co.id
      JOIN utilisateur u ON m.utilisateur_id = u.id
      JOIN checkpoint ch ON m.checkpoint_id = ch.id
    `;
    const params = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`co.numero_conteneur LIKE ?`);
      params.push(`%${search}%`);
    }

    if (date) {
      whereClauses.push(`DATE(m.date_heure) = ?`);
      params.push(date);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY m.date_heure DESC LIMIT 100;`;

    connection = await pool.getConnection();
    const [movements] = await connection.query(sql, params);

    const groupedMovements = movements.reduce((acc, mov) => {
      const key = mov.nom_checkpoint;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(mov);
      return acc;
    }, {});

    res.json(groupedMovements);

  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  } finally {
    if (connection) connection.release();
  }
};
