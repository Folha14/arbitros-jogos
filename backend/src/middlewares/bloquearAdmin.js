function bloquearAdmin(req, res, next) {
  if (req.utilizador?.role === 'admin') {
    return res.status(403).json({ erro: 'Admins nao podem criar registos de arbitragem.' });
  }
  next();
}

module.exports = bloquearAdmin;