const pool = require('../config/db');

const validateContainerExit = async (req, res) => {
  const { containerId } = req.params;
  const { matricule } = req.body;
  const { userId, checkpointId } = req.user;

  if (!matricule) {
    return res.status(400).json({ message: "L'immatriculation du camion est requise." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Trouver ou créer le camion
    await connection.query('INSERT INTO camion (matricule) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [matricule]);
    const [[truck]] = await connection.query('SELECT id FROM camion WHERE matricule = ?', [matricule]);
    const camionId = truck.id;

    // 2. Mettre à jour le conteneur avec les BONS NOMS DE COLONNES
    await connection.query(
      "UPDATE conteneur SET statut = 'en_transit_vers_pia', camion_id = ?, date_sortie_port = NOW() WHERE id = ?",
      [camionId, containerId]
    );

    // 3. Enregistrer le mouvement
    await connection.query(
      'INSERT INTO mouvement (conteneur_id, checkpoint_id, utilisateur_id, date_heure, matricule_camion) VALUES (?, ?, ?, NOW(), ?)',
      [containerId, checkpointId, userId, matricule]
    );

    await connection.commit();
    res.status(200).json({ message: 'Sortie du conteneur validée avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(`[BACKEND] Erreur lors de la validation de la sortie du conteneur ${containerId}:`, error);
    res.status(500).json({ message: 'Erreur du serveur lors de la validation de la sortie.' });
  } finally {
    connection.release();
  }
};

const validateContainerArrival = async (req, res) => {
  const { containerId } = req.params;
  const { userId } = req.user;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [checkpoint] = await connection.query("SELECT id FROM checkpoint WHERE nom = 'Entrée PIA'");
    if (checkpoint.length === 0) {
        await connection.rollback();
        return res.status(500).json({ message: "Checkpoint 'Entrée PIA' non trouvé." });
    }
    const checkpointId = checkpoint[0].id;

    // 1. Mettre à jour le statut du conteneur et enregistrer la date d'arrivée
    await connection.query(
      "UPDATE conteneur SET statut = 'arrive_a_pia', date_arrivee_pia = NOW() WHERE id = ?",
      [containerId]
    );

    // 2. Récupérer l'immatriculation pour l'enregistrement du mouvement
    const [[container]] = await connection.query(
      'SELECT ca.matricule FROM conteneur co JOIN camion ca ON co.camion_id = ca.id WHERE co.id = ?', 
      [containerId]
    );

    // 3. Enregistrer le mouvement
    await connection.query(
      'INSERT INTO mouvement (conteneur_id, checkpoint_id, utilisateur_id, date_heure, matricule_camion) VALUES (?, ?, ?, NOW(), ?)',
      [containerId, checkpointId, userId, container.matricule]
    );

    await connection.commit();
    res.status(200).json({ message: 'Arrivée du conteneur validée avec succès.' });

  } catch (error) {
    await connection.rollback();
    console.error("Erreur lors de la validation d'arrivée:", error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  } finally {
    connection.release();
  }
};

const validatePIADeparture = async (req, res) => {
  const { containerId } = req.params;
  const { mode_enlevement, regime, destination, client } = req.body;
  const { userId } = req.user; // On a juste besoin de l'ID de l'utilisateur

  if (!mode_enlevement || !regime || !destination || !client) {
    return res.status(400).json({ message: 'Toutes les informations sont requises.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Mettre à jour le conteneur
    await connection.query(
      `UPDATE conteneur SET
        statut = 'sortie_pia', date_sortie_pia = NOW(),
        mode_enlevement = ?, regime = ?, destination = ?, client = ?
       WHERE id = ?`,
      [mode_enlevement, regime, destination, client, containerId]
    );

    // 2. Récupérer l'ID du checkpoint "Sortie PIA" et l'immatriculation du camion
    const [[checkpoint]] = await connection.query("SELECT id FROM checkpoint WHERE nom = 'Sortie PIA'");
    const checkpointId = checkpoint.id;

    const [[container]] = await connection.query(
      'SELECT ca.matricule FROM conteneur co JOIN camion ca ON co.camion_id = ca.id WHERE co.id = ?',
      [containerId]
    );

    // 3. ENREGISTRER LE MOUVEMENT (la partie qui manquait)
    await connection.query(
      'INSERT INTO mouvement (conteneur_id, checkpoint_id, utilisateur_id, date_heure, matricule_camion) VALUES (?, ?, ?, NOW(), ?)',
      [containerId, checkpointId, userId, container.matricule]
    );

    await connection.commit();
    res.status(200).json({ message: 'Sortie PIA validée avec succès.' });

  } catch (error) {
    await connection.rollback();
    console.error("Erreur lors de la validation de sortie PIA:", error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  } finally {
    connection.release();
  }
};

module.exports = {
  validateContainerExit,
  validateContainerArrival,
  validatePIADeparture
};