const express = require('express');
const jwt = require('jsonwebtoken');
const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const router = express.Router();
const { register, login, confirmarEmail, validar2FA, reenviar2FA } = require('../controllers/authController');

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Demasiadas tentativas. Tenta novamente mais tarde.' },
};

function criarRateLimit(keyGenerator) {
  return rateLimit({
    ...rateLimitConfig,
    ...(keyGenerator && { keyGenerator }),
  });
}

function chaveValidacao2FA(req) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const chaveIp = ipKeyGenerator(clientIp);

  try {
    const decoded = jwt.verify(req.body?.tempToken, process.env.JWT_SECRET);
    if (decoded.passo === '2fa_pendente' && Number.isInteger(decoded.id)) {
      return `${chaveIp}:utilizador:${decoded.id}`;
    }
  } catch {
    return chaveIp;
  }

  return chaveIp;
}

router.post('/register', criarRateLimit(), register);
router.post('/login', criarRateLimit(), login);
router.post('/confirmar-email', confirmarEmail);
router.post('/validar-2fa', criarRateLimit(chaveValidacao2FA), validar2FA);
router.post('/reenviar-2fa', criarRateLimit(), reenviar2FA);

module.exports = router;