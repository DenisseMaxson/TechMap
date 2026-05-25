const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../UTILS/authMiddleware');
const controller = require('../CONTROLLERS/exportController');

router.use(authMiddleware.authenticate);

// BD completa de una empresa
// GET /api/exportar/empresa/:id?ref=SOL-2025-001
router.get('/empresa/:id', controller.exportEmpresa);

// Lista de usuarios de una empresa
// GET /api/exportar/usuarios/:id
router.get('/usuarios/:id', controller.exportUsuarios);

module.exports = router;