const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function insertAdminUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pia_containers',
  });

  try {
    const email = 'admin@pia.tg';
    const plainPassword = 'mot_de_passe_en_clair';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if user already exists
    const [rows] = await connection.execute('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('Utilisateur admin déjà existant.');
    } else {
      // Insert new admin user
      await connection.execute(
        'INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
        ['Admin Général', email, hashedPassword, 'Admin']
      );
      console.log('Utilisateur admin inséré avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'insertion de l\'utilisateur admin :', error);
  } finally {
    await connection.end();
  }
}

insertAdminUser();
