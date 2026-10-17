function verificarAdmin(req, res, next) {
  if (req.utilizador.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = verificarAdmin;