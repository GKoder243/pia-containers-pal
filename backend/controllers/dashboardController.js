const pool = require('../config/db');

const getAdminDashboardData = async (req, res) => {
  console.log('[BACKEND /dashboard/admin] Requête reçue.');
  let connection;
  try {
    connection = await pool.getConnection();
    // Requête 1: KPIs
    const [[kpis]] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM conteneur WHERE statut = 'attente_sortie_port') as containersAwaitingExit,
        (SELECT COUNT(*) FROM conteneur WHERE statut = 'en_transit_vers_pia') as containersInTransit,
        (SELECT COUNT(*) FROM utilisateur WHERE role IN ('CC', 'PIA')) as activeUsers
    `);
    console.log('[BACKEND /dashboard/admin] KPIs récupérés:', kpis);

    // Requête 2: Graphique
    // Requête 2: Graphique de l'activité totale (mouvements)
    const [activityResult] = await pool.query(`
      SELECT
        DATE(date_heure) as activityDate,
        COUNT(*) as dailyCount
      FROM mouvement
      WHERE date_heure >= CURDATE() - INTERVAL 6 DAY
      GROUP BY activityDate
      ORDER BY activityDate ASC
    `);
    console.log('[BACKEND /dashboard/admin] Données brutes du graphique (activité):', activityResult);

    // Formater les données du graphique de manière sûre
    const weeklyImports = {
      labels: Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3);
      }),
      data: Array(7).fill(0)
    };

    activityResult.forEach(row => {
      if(row.activityDate) {
        const date = new Date(row.activityDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = today - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 7) {
          const index = 6 - diffDays;
          weeklyImports.data[index] = row.dailyCount;
        }
      }
    });
    weeklyImports.data.reverse(); // On inverse à la fin

    const responseData = { ...kpis, weeklyImportsData: weeklyImports };
    console.log('[BACKEND /dashboard/admin] Données finales envoyées au client:', responseData);

    res.json(responseData);

  } catch (error) {
    console.error("[BACKEND /dashboard/admin] ERREUR CRITIQUE:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  } finally {
    if (connection) connection.release();
  }
};

const getCCDashboardData = async (req, res) => {
  console.log(`[BACKEND /dashboard/cc] Requête reçue pour le dashboard CC. Utilisateur ID: ${req.user.userId}`);
  let connection;
  try {
    connection = await pool.getConnection();
    const [containers] = await connection.query(
      `SELECT
        co.id, co.numero_conteneur, co.consignataire, co.date_debarquement,
        ca.matricule as matricule_camion
       FROM conteneur co
       LEFT JOIN camion ca ON co.camion_id = ca.id
       WHERE co.statut = 'attente_sortie_port'
       ORDER BY co.id DESC`
    );
    console.log(`[BACKEND /dashboard/cc] Requête SQL réussie. ${containers.length} conteneurs trouvés.`);
    res.json(containers);
  } catch (error) {
    console.error("[BACKEND /dashboard/cc] ERREUR lors de la récupération des données:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  } finally {
    if (connection) connection.release();
  }
};

const getPIADashboardData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [containers] = await connection.query(
      `SELECT
        co.id, co.numero_conteneur, co.date_sortie_port,
        ca.matricule as matricule_camion
       FROM conteneur co
       LEFT JOIN camion ca ON co.camion_id = ca.id
       WHERE co.statut = 'en_transit_vers_pia'
       ORDER BY co.date_sortie_port ASC` // On trie par les plus anciens départs
    );
    res.json(containers);
  } catch (error) {
    console.error("Erreur lors de la récupération des données du dashboard PIA:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  } finally {
    if (connection) connection.release();
  }
};

const getContainersAtPIA = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [containers] = await connection.query(
      `SELECT
    co.id, co.numero_conteneur, co.date_arrivee_pia
   FROM conteneur co
   WHERE co.statut = 'arrive_a_pia'
   ORDER BY co.date_arrivee_pia ASC`
    );
    res.json(containers);
  } catch (error) {
    console.error("Erreur lors de la récupération des conteneurs à la PIA:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAdminDashboardData,
  getCCDashboardData,
  getPIADashboardData,
  getContainersAtPIA
};