const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function insertAdminUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'pia-containers-pal');
    const users = db.collection('users');

    const email = 'admin@pia.tg';
    const plainPassword = 'mot_de_passe_en_clair';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.log('Utilisateur admin déjà existant.');
    } else {
      await users.insertOne({
        email,
        mot_de_passe: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
      console.log('Utilisateur admin inséré avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'insertion de l\'utilisateur admin:', error);
  } finally {
    await client.close();
  }
}

insertAdminUser();
