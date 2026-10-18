const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { enviarEmailVerificacao, enviarCodigo2FA } = require('../services/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  const { nome, telefone, email, password } = req.body;

  const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';
  const telefoneLimpo = String(telefone || '').replace(/\D/g, '').slice(0, 9);
  const emailLimpo = typeof email === 'string' ? email.toLowerCase().trim() : '';

  if (!nomeLimpo || !telefoneLimpo || !emailLimpo || typeof password !== 'string' || !password) {
    return res.status(400).json({
      erro: 'Nome, contacto telefónico, email e password são obrigatórios',
    });
  }

  if (nomeLimpo.length > 100) {
    return res.status(400).json({ erro: 'O nome não pode exceder 100 caracteres' });
  }

  if (!EMAIL_REGEX.test(emailLimpo)) {
    return res.status(400).json({ erro: 'O formato do email é inválido' });
  }



  if (!/^\d{9}$/.test(telefoneLimpo)) {
    return res.status(400).json({
      erro: 'O contacto telefónico deve ter exatamente 9 dígitos',
    });
  }

  try {
    const utilizadorExistente = await prisma.utilizador.findUnique({
      where: { email: emailLimpo },
    });

    if (utilizadorExistente) {
      if (!utilizadorExistente.emailConfirmado && utilizadorExistente.tokenConfirmacaoEmail) {
        const emailEnviado = await enviarEmailVerificacao(
          emailLimpo,
          utilizadorExistente.tokenConfirmacaoEmail,
          utilizadorExistente.nome
        );

        if (!emailEnviado) {
          return res.status(503).json({
            erro: 'A conta existe, mas não foi possível enviar o email. Podes pedir novo email submetendo novamente o registo.',
          });
        }

        return res.status(409).json({
          erro: 'A conta existe e ainda não está confirmada. Enviámos novamente o email de confirmação.',
        });
      }

      return res.status(409).json({ erro: 'Já existe uma conta com este email' });
    }

    if (password.length < 8) {
      return res.status(400).json({ erro: 'A password deve ter pelo menos 8 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const tokenConfirmacaoEmail = crypto.randomBytes(32).toString('hex');

    const novoUtilizador = await prisma.utilizador.create({
      data: {
        nome: nomeLimpo,
        telefone: telefoneLimpo,
        email: emailLimpo,
        passwordHash,
        funcaoPadrao: 'arbitro',
        role: 'utilizador',
        emailConfirmado: false,
        tokenConfirmacaoEmail,
      },
    });

    // Envia email de ativação
    const emailEnviado = await enviarEmailVerificacao(
      emailLimpo,
      tokenConfirmacaoEmail,
      nomeLimpo
    );

    if (!emailEnviado) {
      return res.status(503).json({
        erro: 'A conta foi criada, mas não foi possível enviar o email. Podes pedir novo email submetendo novamente o registo.',
      });
    }

    return res.status(201).json({
      requerConfirmacaoEmail: true,
      mensagem: 'Conta criada com sucesso. Por favor, verifica o teu email para ativar a conta antes de entrar.',
      email: emailLimpo,
    });
  } catch (err) {
    console.error('ERRO REGISTER:', err.message);

    if (err.code === 'P2002') {
      return res.status(409).json({ erro: 'Já existe uma conta com este email' });
    }

    return res.status(500).json({
      erro: 'Erro ao criar conta',
    });
  }
}

async function confirmarEmail(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ erro: 'Token de ativação é obrigatório' });
  }

  try {
    const utilizador = await prisma.utilizador.findFirst({
      where: { tokenConfirmacaoEmail: token },
    });

    if (!utilizador) {
      return res.status(400).json({ erro: 'Token de ativação inválido ou expirado' });
    }

    await prisma.utilizador.update({
      where: { id: utilizador.id },
      data: {
        emailConfirmado: true,
        tokenConfirmacaoEmail: null,
      },
    });

    return res.json({ mensagem: 'Email confirmado com sucesso! Podes agora iniciar sessão.' });
  } catch (err) {
    console.error('ERRO CONFIRMAR EMAIL:', err);
    return res.status(500).json({ erro: 'Erro ao confirmar email' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ erro: 'Email e password são obrigatórios' });
  }

  const emailLimpo = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(emailLimpo)) {
    return res.status(400).json({ erro: 'O formato do email é inválido' });
  }

  try {
    const utilizador = await prisma.utilizador.findUnique({
      where: { email: emailLimpo },
    });

    if (!utilizador) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaCorreta = await bcrypt.compare(password, utilizador.passwordHash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    // Verificar se o email já foi verificado
    if (!utilizador.emailConfirmado) {
      return res.status(403).json({
        erro: 'A tua conta ainda não foi ativada. Por favor verifica a tua caixa de entrada de email.',
        emailNaoConfirmado: true,
      });
    }

    // Gerar Código 2FA de 6 dígitos
    const codigo2FA = crypto.randomInt(100000, 1000000).toString();
    const codigo2FAExpira = new Date(Date.now() + 10 * 60 * 1000); // Válido por 10 minutos

    await prisma.utilizador.update({
      where: { id: utilizador.id },
      data: {
        codigo2FA,
        codigo2FAExpira,
        tentativas2FA: 0,
      },
    });

    // Enviar código 2FA por email
    const emailEnviado = await enviarCodigo2FA(utilizador.email, codigo2FA, utilizador.nome);

    if (!emailEnviado && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ erro: 'Erro ao autenticar' });
    }

    // Gerar token temporário para permitir o passo 2 da validação do 2FA
    const tempToken = jwt.sign(
      { id: utilizador.id, passo: '2fa_pendente' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      requer2FA: true,
      mensagem: 'Código de verificação enviado para o teu email.',
      tempToken,
      email: utilizador.email,
    });
  } catch (err) {
    console.error('ERRO LOGIN:', err.message);
    return res.status(500).json({
      erro: 'Erro ao autenticar',
    });
  }
}

async function validar2FA(req, res) {
  const { tempToken, codigo } = req.body;

  if (!tempToken || !codigo) {
    return res.status(400).json({ erro: 'Token temporário e código de segurança são obrigatórios' });
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ erro: 'Sessão 2FA expirada ou inválida.' });
  }

  if (decoded.passo !== '2fa_pendente') {
    return res.status(401).json({ erro: 'Sessão 2FA inválida' });
  }

  try {
    const utilizador = await prisma.utilizador.findUnique({
      where: { id: decoded.id },
    });

    if (!utilizador || !utilizador.codigo2FA || !utilizador.codigo2FAExpira) {
      return res.status(401).json({ erro: 'Código inválido ou expirado. Pede um novo código.' });
    }

    const agora = new Date();
    if (agora >= utilizador.codigo2FAExpira) {
      return res.status(401).json({ erro: 'Código inválido ou expirado. Pede um novo código.' });
    }

    if (utilizador.codigo2FA !== String(codigo).trim()) {
      const resultadoFalha = await prisma.$transaction(async (tx) => {
        const incremento = await tx.utilizador.updateMany({
          where: {
            id: utilizador.id,
            codigo2FA: utilizador.codigo2FA,
            codigo2FAExpira: { equals: utilizador.codigo2FAExpira, gt: agora },
            tentativas2FA: { lt: 5 },
          },
          data: { tentativas2FA: { increment: 1 } },
        });

        if (incremento.count !== 1) {
          return 'codigo-indisponivel';
        }

        const invalidacao = await tx.utilizador.updateMany({
          where: {
            id: utilizador.id,
            codigo2FA: utilizador.codigo2FA,
            codigo2FAExpira: { equals: utilizador.codigo2FAExpira, gt: agora },
            tentativas2FA: { gte: 5 },
          },
          data: {
            codigo2FA: null,
            codigo2FAExpira: null,
          },
        });

        return invalidacao.count === 1 ? 'novo-codigo-necessario' : 'codigo-incorreto';
      });

      if (resultadoFalha === 'novo-codigo-necessario' || resultadoFalha === 'codigo-indisponivel') {
        return res.status(401).json({ erro: 'Código inválido ou expirado. Pede um novo código.' });
      }

      return res.status(401).json({ erro: 'Código de segurança inválido.' });
    }

    const consumo = await prisma.utilizador.updateMany({
      where: {
        id: utilizador.id,
        codigo2FA: utilizador.codigo2FA,
        codigo2FAExpira: { equals: utilizador.codigo2FAExpira, gt: agora },
        tentativas2FA: { lt: 5 },
      },
      data: {
        codigo2FA: null,
        codigo2FAExpira: null,
        tentativas2FA: 0,
      },
    });

    if (consumo.count !== 1) {
      return res.status(401).json({ erro: 'Código inválido ou expirado. Pede um novo código.' });
    }

    // Emitir Token JWT Final
    const token = jwt.sign(
      {
        id: utilizador.id,
        nome: utilizador.nome,
        email: utilizador.email,
        role: utilizador.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      utilizador: {
        id: utilizador.id,
        nome: utilizador.nome,
        telefone: utilizador.telefone,
        email: utilizador.email,
        role: utilizador.role,
        funcaoPadrao: utilizador.funcaoPadrao,
      },
    });
  } catch (err) {
    console.error('ERRO VALIDAR 2FA:', err);
    return res.status(500).json({ erro: 'Erro ao validar o código de segurança.' });
  }
}

async function reenviar2FA(req, res) {
  const { tempToken } = req.body;

  if (!tempToken) {
    return res.status(400).json({ erro: 'Sessão inválida' });
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const utilizador = await prisma.utilizador.findUnique({
      where: { id: decoded.id },
    });

    if (!utilizador) {
      return res.status(404).json({ erro: 'Utilizador não encontrado' });
    }

    const codigo2FA = crypto.randomInt(100000, 1000000).toString();
    const codigo2FAExpira = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.utilizador.update({
      where: { id: utilizador.id },
      data: { codigo2FA, codigo2FAExpira, tentativas2FA: 0 },
    });

    await enviarCodigo2FA(utilizador.email, codigo2FA, utilizador.nome);

    return res.json({ mensagem: 'Novo código de segurança enviado por email.' });
  } catch (err) {
    return res.status(401).json({ erro: 'Sessão expirada' });
  }
}

module.exports = { register, login, confirmarEmail, validar2FA, reenviar2FA };