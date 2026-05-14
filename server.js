const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
const empresaRoutes  = require('./ROUTES/empresaRoutes');
const usuarioRoutes  = require('./ROUTES/usuarioRoutes');
const equipoRoutes  = require('./ROUTES/equipoRoutes');

app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/equipos', equipoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor TechMap corriendo en http://localhost:${PORT}`);
});