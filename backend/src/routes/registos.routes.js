const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const bloquearAdmin = require('../middlewares/bloquearAdmin');
const { criarRegisto, listarRegistos, exportarRegistos } = require('../controllers/registosController');

router.use(verificarToken);

router.get('/export', exportarRegistos);
router.post('/', bloquearAdmin, criarRegisto);
router.get('/', listarRegistos);

module.exports = router;