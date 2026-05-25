const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../UTILS/authMiddleware');
const controller = require('../CONTROLLERS/empresaController');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['administrador']));

router.get   ('/',        controller.getAll);
router.get   ('/:id/export', controller.exportEmpresa);
router.post  ('/insert',  controller.insert);
router.put   ('/update',  controller.update);
router.delete('/delete',  controller.delete);

module.exports = router;
