const express = require('express');
const router = express.Router();
const authMiddleware = require('../UTILS/authMiddleware');
const mantenimientoController = require('../CONTROLLERS/mantenimientoController');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['ti', 'contabilidad', 'administrador']));

router.get('/empresa/:empresa_id', mantenimientoController.getMantenimientosByEmpresa);
router.post('/programar-preventivos', mantenimientoController.programarPreventivos);
router.post('/', mantenimientoController.registrarMantenimiento);
router.put('/', mantenimientoController.registrarMantenimiento);

module.exports = router;
