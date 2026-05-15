const express    = require('express');
const router     = express.Router();
const controller = require('../CONTROLLERS/usuarioController');

router.get   ('/',        controller.getAll);
router.get   ('/empresa/:empresaId/export', controller.exportByEmpresa);
router.post  ('/login',   controller.login);
router.post  ('/insert',  controller.insert);
router.put   ('/update',  controller.update);
router.delete('/delete',  controller.delete);

module.exports = router;
