const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const apenasAdmin = require('../middlewares/apenasAdmin');
const {
  listarJogos,
  criarJogo,
  atualizarJogo,
  apagarJogo,
} = require('../controllers/adminJogosController');

router.use(verificarToken);
router.use(apenasAdmin);

router.get('/', listarJogos);
router.post('/', criarJogo);
router.put('/:id', atualizarJogo);
router.delete('/:id', apagarJogo);

module.exports = router;