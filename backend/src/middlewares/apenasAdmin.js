function apenasAdmin(req, res, next) {
  if (!req.utilizador || req.utilizador.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  next();
}

module.exports = apenasAdmin;