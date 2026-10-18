jest.mock('../config/database', () => ({
  utilizador: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../services/emailService', () => ({
  enviarEmailVerificacao: jest.fn(),
  enviarCodigo2FA: jest.fn(),
}));

const crypto = require('crypto');
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarCodigo2FA } = require('../services/emailService');
const { login, validar2FA, register } = require('./authController');

const OTP_FIXTURE = '654321';
const CREDENCIAIS_FIXTURE = {
  email: 'arbitro@example.test',
  password: 'password-fixture',
};

function criarRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function criarUtilizador(overrides = {}) {
  return {
    id: 1,
    nome: 'Utilizador de teste',
    email: CREDENCIAIS_FIXTURE.email,
    role: 'admin',
    passwordHash: 'hash-fixture',
    telefone: null,
    funcaoPadrao: 'arbitro',
    emailConfirmado: true,
    codigo2FA: OTP_FIXTURE,
    codigo2FAExpira: new Date(Date.now() + 60_000),
    tentativas2FA: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  bcrypt.compare.mockResolvedValue(true);
  jwt.sign.mockImplementation((payload) =>
    payload.passo === '2fa_pendente' ? 'temp-token-fixture' : 'jwt-final-fixture'
  );
  jwt.verify.mockReturnValue({ id: 1, passo: '2fa_pendente' });
  enviarCodigo2FA.mockResolvedValue(true);
  prisma.utilizador.update.mockResolvedValue({});
  prisma.utilizador.updateMany.mockResolvedValue({ count: 1 });
  prisma.$transaction.mockImplementation((callback) =>
    callback({ utilizador: { updateMany: prisma.utilizador.updateMany } })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('login', () => {
  it('rejeita credenciais inválidas quando utilizador não existe', async () => {
    prisma.utilizador.findUnique.mockResolvedValue(null);
    const req = { body: CREDENCIAIS_FIXTURE };
    const res = criarRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('gera o JWT final com role correto após validar o código 2FA', async () => {
    const utilizador = criarUtilizador({ tentativas2FA: 3 });
    const findUnique = jest.spyOn(crypto, 'randomInt').mockReturnValue(Number(OTP_FIXTURE));
    prisma.utilizador.findUnique
      .mockResolvedValueOnce(utilizador)
      .mockResolvedValueOnce(utilizador);

    const resLogin = criarRes();
    await login({ body: CREDENCIAIS_FIXTURE }, resLogin);

    expect(resLogin.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requer2FA: true,
        tempToken: 'temp-token-fixture',
      })
    );
    expect(prisma.utilizador.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigo2FA: OTP_FIXTURE,
          tentativas2FA: 0,
        }),
      })
    );
    expect(findUnique).toHaveBeenCalledWith(100000, 1000000);

    const resValidacao = criarRes();
    await validar2FA(
      { body: { tempToken: 'temp-token-fixture', codigo: OTP_FIXTURE } },
      resValidacao
    );

    expect(jwt.sign).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: 'admin' }),
      process.env.JWT_SECRET,
      expect.objectContaining({ expiresIn: '7d' })
    );
    expect(prisma.utilizador.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigo2FA: null,
          codigo2FAExpira: null,
          tentativas2FA: 0,
        }),
      })
    );
    expect(resValidacao.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'jwt-final-fixture',
        utilizador: expect.objectContaining({ role: 'admin' }),
      })
    );
  });

  it('incrementa atomicamente o contador num código errado sem revelar tentativas restantes', async () => {
    prisma.utilizador.findUnique.mockResolvedValue(
      criarUtilizador({ tentativas2FA: 2 })
    );
    prisma.utilizador.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const res = criarRes();

    await validar2FA(
      { body: { tempToken: 'temp-token-fixture', codigo: '111111' } },
      res
    );

    expect(prisma.utilizador.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: { tentativas2FA: { increment: 1 } },
      })
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Código de segurança inválido.' });
  });

  it('invalida o código na quinta falha e pede um novo sem revelar o contador', async () => {
    prisma.utilizador.findUnique.mockResolvedValue(
      criarUtilizador({ tentativas2FA: 4 })
    );
    prisma.utilizador.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    const res = criarRes();

    await validar2FA(
      { body: { tempToken: 'temp-token-fixture', codigo: '111111' } },
      res
    );

    expect(prisma.utilizador.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { codigo2FA: null, codigo2FAExpira: null },
      })
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Código inválido ou expirado. Pede um novo código.',
    });
  });

  it('não conta um código expirado e pede um novo código', async () => {
    prisma.utilizador.findUnique.mockResolvedValue(
      criarUtilizador({ codigo2FAExpira: new Date(Date.now() - 60_000) })
    );
    const res = criarRes();

    await validar2FA(
      { body: { tempToken: 'temp-token-fixture', codigo: '111111' } },
      res
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.utilizador.updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Código inválido ou expirado. Pede um novo código.',
    });
  });
});

describe('register', () => {
  it('rejeita se faltar campo obrigatório', async () => {
    const req = { body: { nome: '', telefone: '', email: '', password: '' } };
    const res = criarRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejeita email duplicado', async () => {
    prisma.utilizador.findUnique.mockResolvedValue({ id: 1 });
    const req = {
      body: {
        nome: 'Utilizador de teste',
        telefone: '912345678',
        email: CREDENCIAIS_FIXTURE.email,
        password: 'password-fixture',
      },
    };
    const res = criarRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
