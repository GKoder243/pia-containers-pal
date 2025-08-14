const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, nom, email, mot_de_passe, role FROM utilisateur');
    res.json(users);
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
};

exports.createUser = async (req, res) => {
  const { nom, email, mot_de_passe, role, checkpoint_id } = req.body; // Ajoute checkpoint_id

  if (!nom || !email || !mot_de_passe || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const [existingUsers] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Utilisateur déjà existant.' });
    }

    // 🔐 Hasher le mot de passe avant insertion
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

    const sql = 'INSERT INTO utilisateur (nom, email, mot_de_passe, role, checkpoint_id) VALUES (?, ?, ?, ?, ?)';
    // S'assure que checkpoint_id est null s'il n'est pas fourni (pour les Admins)
    const params = [nom, email, hashedPassword, role, checkpoint_id || null];

    await db.query(sql, params);

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
  }
};


exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nom, email, role, checkpoint_id } = req.body;
  if (!nom || !email || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }
  try {
    await db.query(
      'UPDATE utilisateur SET nom = ?, email = ?, role = ?, checkpoint_id = ? WHERE id = ?',
      [nom, email, role, checkpoint_id || null, id]
    );
    res.json({ message: 'Utilisateur mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM utilisateur WHERE id = ?', [id]);
    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
  }
};
