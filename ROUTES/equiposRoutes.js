const express = require('express');
const router  = express.Router();
const equipoController = require('../CONTROLLERS/equipoController');

// Obtener lista de equipos por empresa
// URL: http://localhost:3000/api/equipos/empresa/1
router.get('/empresa/:empresa_id', equipoController.getEquiposByEmpresa);

// Obtener estadísticas para el Dashboard
// URL: http://localhost:3000/api/equipos/dashboard/1
router.get('/dashboard/:empresa_id', equipoController.getDashboardStats);

// Registrar un nuevo equipo (Los 11 campos técnicos)
router.post('/', equipoController.insert);

// Actualizar datos de un equipo
router.put('/', equipoController.update);

// Dar de baja a un equipo (Baja lógica)
router.delete('/', equipoController.delete);

module.exports = router;