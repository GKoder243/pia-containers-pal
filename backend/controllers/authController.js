const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Connexion de l'utilisateur
exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;
  console.log(`\n--- [AUTH] Tentative de connexion reçue pour l'email: ${email} ---`);

  if (!email || !mot_de_passe) {
    console.log('[AUTH] Échec: Email ou mot de passe manquant dans la requête.');
    return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe' });
  }

  try {
    const [users] = await db.query('SELECT id, nom, email, mot_de_passe, role, checkpoint_id FROM utilisateur WHERE email = ?', [email]);

    if (users.length === 0) {
      console.log(`[AUTH] Échec: Aucun utilisateur trouvé dans la base de données avec l'email: ${email}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    console.log(`[AUTH] Succès: Utilisateur trouvé - ID: ${user.id}, Rôle: ${user.role}`);

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isMatch) {
      console.log('[AUTH] Échec: Le mot de passe fourni ne correspond pas au hash de la base de données.');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('[AUTH] Succès: Le mot de passe correspond.');

    const token = jwt.sign({ id: user.id, role: user.role, checkpointId: user.checkpoint_id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    console.log('[AUTH] Succès: Token JWT généré. Connexion réussie.');
    res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });

  } catch (error) {
    console.error('[AUTH] ERREUR CRITIQUE:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom || !email || !mot_de_passe || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Vérifier si l'email est déjà utilisé
    const [existingUsers] = await db.query('SELECT id FROM utilisateur WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insertion du nouvel utilisateur
    await db.query(
      'INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
      [nom, email, hashedPassword, role]
    );

    return res.status(201).json({ message: 'Inscription réussie.' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
};
