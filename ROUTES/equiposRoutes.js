const express = require('express');
const router  = express.Router();
const authMiddleware = require('../UTILS/authMiddleware');
const equipoController = require('../CONTROLLERS/equipoController');

router.use(authMiddleware.authenticate);

// Obtener lista de equipos por empresa
// URL: http://localhost:3000/api/equipos/empresa/1
router.get('/empresa/:empresa_id', equipoController.getEquiposByEmpresa);

// Obtener solicitudes de baja de una empresa
router.get('/bajas/empresa/:empresa_id', equipoController.getSolicitudesBaja);

// Obtener estadísticas para el Dashboard
// URL: http://localhost:3000/api/equipos/dashboard/1
router.get('/dashboard/:empresa_id', equipoController.getDashboardStats);

// Historial de movimientos desde base de datos
router.get('/historial/:empresa_id', equipoController.getHistorial);

// Registrar un nuevo equipo (Los 11 campos técnicos)
router.post('/', equipoController.insert);

// 🚀 RUTA AGREGADA: Procesar la solicitud de baja y enviar correo al jefe
// URL: http://localhost:3000/api/equipos/solicitar-baja
router.post('/solicitar-baja', equipoController.solicitarBaja);

// Resolver solicitud de baja validando empresa
router.put('/bajas/resolver', authMiddleware.authorize(['jefe_area', 'administrador']), equipoController.resolverBaja);

// Actualizar datos de un equipo
router.put('/', equipoController.update);

// En tu archivo ROUTES/equiposRoutes.js:
router.delete('/', equipoController.bajaLogica);

// Exportar ficha técnica de un equipo específico en formato PDF
// URL: http://localhost:3000/api/equipos/exportar/1
router.get('/exportar/:id', equipoController.exportPDF);

// Alias de compatibilidad para rutas antiguas o referencias erróneas
// URL: http://localhost:3000/api/equipos/export/1
router.get('/export/:id', equipoController.exportPDF);

module.exports = router;
