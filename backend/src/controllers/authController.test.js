jest.mock('../config/database', () => ({
    utilizador: {
    findUnique: jest.fn(),
    create: jest.fn(),
    },
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { login, register } = require('./authController');

function criarRes() {
    return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    };
}

describe('login', () => {
    it('rejeita credenciais invalidas quando utilizador nao existe', async () => {
    prisma.utilizador.findUnique.mockResolvedValue(null);
    const req = { body: { email: 'x@x.pt', password: '123' } };
    const res = criarRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    });

    it('gera token com role correto', async () => {
    prisma.utilizador.findUnique.mockResolvedValue({
        id: 1, nome: 'Jose', email: 'jose@grib.pt', role: 'admin', passwordHash: 'hash', telefone: '912345678',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token-fake');

    const req = { body: { email: 'jose@grib.pt', password: '123' } };
    const res = criarRes();

    await login(req, res);

    const argumentosChamada = jwt.sign.mock.calls[0];
    expect(argumentosChamada[0]).toEqual(
        expect.objectContaining({ role: 'admin' })
    );
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'token-fake' })
    );
});
});

describe('register', () => {
    it('rejeita se faltar campo obrigatorio', async () => {
    const req = { body: { nome: '', telefone: '', email: '', password: '' } };
    const res = criarRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejeita email duplicado', async () => {
    prisma.utilizador.findUnique.mockResolvedValue({ id: 1 });
    const req = { body: { nome: 'Jose', telefone: '912345678', email: 'jose@grib.pt', password: '123' } };
    const res = criarRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    });
});