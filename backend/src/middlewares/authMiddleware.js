const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token nao fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.utilizador = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token invalido ou expirado' });
  }
}

module.exports = verificarToken;