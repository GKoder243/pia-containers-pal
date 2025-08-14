const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const importRoutes = require('./routes/import');
const dashboardRoutes = require('./routes/dashboard');
const containerRoutes = require('./routes/container');
const checkpointRoutes = require('./routes/checkpoint');
const reportRoutes = require('./routes/report');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/import', importRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/reports', reportRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API PIA Containers en ligne');
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données réussie');
    connection.release();

    app.listen(PORT, () => {
      console.log(`✅ Serveur lancé sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

startServer();
