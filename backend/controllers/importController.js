const excelImportService = require('../services/excelImportService');
const pool = require('../config/db'); // Importe le pool de connexions MySQL

// La fonction previewUpload ne change pas
const previewUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }
    const headers = excelImportService.getExcelHeaders(req.file.buffer);
    res.status(200).json(headers);
  } catch (error) {
    console.error("Erreur lors de l'analyse des en-têtes:", error);
    res.status(500).json({ message: "Erreur du serveur lors de l'analyse du fichier." });
  }
};

// Remplace l'ancienne fonction processUpload par celle-ci
const processUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni.' });
  }

  let connection;
  try {
    const mapping = JSON.parse(req.body.mapping);
    const data = excelImportService.processExcelWithMapping(req.file.buffer, mapping);

    console.log(`[Import] Fichier lu, ${data.length} lignes à traiter.`);
    let processedCount = 0;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const [index, row] of data.entries()) {
      const truckMatricule = row.immatriculationCamion;
      const containerNumber = row.numeroConteneur;

      if (!truckMatricule || !containerNumber) {
        console.log(`[Import] Ligne ${index + 2} ignorée: Camion (${truckMatricule}) ou Conteneur (${containerNumber}) manquant.`);
        continue;
      }

      // 1. Gérer le camion (créer s'il n'existe pas)
      // Logique simple pour déterminer le type de camion depuis le code ISO
      const truckType = row.codeISO && row.codeISO.startsWith('4') ? '40' : '20';

      // INSERT ... ON DUPLICATE KEY UPDATE est une façon efficace de gérer l'existence
      const [truckResult] = await connection.execute(
        'INSERT INTO camion (matricule, type) VALUES (?, ?) ON DUPLICATE KEY UPDATE matricule=matricule',
        [truckMatricule, truckType]
      );

      // Récupérer l'ID du camion
      const [[truck]] = await connection.execute('SELECT id FROM camion WHERE matricule = ?', [truckMatricule]);
      const camionId = truck.id;

      // 2. Insérer le conteneur en ignorant les doublons
      // La contrainte UNIQUE sur 'numero_conteneur' va gérer les doublons
      const sql = `
        INSERT IGNORE INTO conteneur
        (numero_conteneur, numero_bl, nom_navire, code_iso, camion_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      await connection.execute(sql, [
        row.numeroConteneur,
        row.numeroBL,
        row.nomNavire,
        row.codeISO,
        camionId
      ]);
      processedCount++;
    }

    console.log(`[Import] Fin du traitement. ${processedCount} lignes ont été traitées pour insertion.`);
    await connection.commit();
    res.status(200).json({
      message: `Importation terminée avec succès. ${data.length} lignes du fichier traitées.`
    });

  } catch (error) {
    if (connection) await connection.rollback(); // Annuler toutes les opérations en cas d'erreur
    console.error("Erreur lors du traitement et de l'insertion:", error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la sauvegarde des données.' });
  } finally {
    if (connection) connection.release(); // Libérer la connexion au pool
  }
};

module.exports = {
  previewUpload,
  processUpload,
};
