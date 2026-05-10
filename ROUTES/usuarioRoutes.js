const express    = require('express');
const router     = express.Router();
const controller = require('../CONTROLLERS/usuarioController');

router.get   ('/',        controller.getAll);
router.post  ('/insert',  controller.insert);
router.put   ('/update',  controller.update);
router.delete('/delete',  controller.delete);

module.exports = router;