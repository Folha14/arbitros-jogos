const express = require('express');
const request = require('supertest');

jest.mock('../config/database', () => ({
  utilizador: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

let mockRoleAtual = 'admin';

jest.mock('../middlewares/authMiddleware', () => (req, res, next) => {
  req.utilizador = { id: 1, role: mockRoleAtual };
  next();
});

const prisma = require('../config/database');

function montarApp(roleSimulado) {
  mockRoleAtual = roleSimulado;
  const app = express();
  app.use(express.json());

  const router = require('./adminUtilizadores.routes');
  app.use('/api/admin/utilizadores', router);
  return app;
}

describe('PATCH /api/admin/utilizadores/:id/funcao-padrao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bloqueia utilizador normal com 403', async () => {
    const app = montarApp('utilizador');

    const res = await request(app)
      .patch('/api/admin/utilizadores/1/funcao-padrao')
      .send({ funcaoPadrao: 'mesa' });

    expect(res.status).toBe(403);
    expect(prisma.utilizador.update).not.toHaveBeenCalled();
  });

  it('rejeita valor invalido com 400', async () => {
    const app = montarApp('admin');

    const res = await request(app)
      .patch('/api/admin/utilizadores/1/funcao-padrao')
      .send({ funcaoPadrao: 'treinador' });

    expect(res.status).toBe(400);
    expect(prisma.utilizador.update).not.toHaveBeenCalled();
  });

  it('rejeita id invalido com 400', async () => {
    const app = montarApp('admin');

    const res = await request(app)
      .patch('/api/admin/utilizadores/abc/funcao-padrao')
      .send({ funcaoPadrao: 'mesa' });

    expect(res.status).toBe(400);
  });

  it('devolve 404 se utilizador nao existir', async () => {
    const app = montarApp('admin');
    prisma.utilizador.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/admin/utilizadores/999/funcao-padrao')
      .send({ funcaoPadrao: 'mesa' });

    expect(res.status).toBe(404);
  });

  it('admin consegue atualizar funcaoPadrao com sucesso', async () => {
    const app = montarApp('admin');
    prisma.utilizador.findUnique.mockResolvedValue({ id: 2, funcaoPadrao: 'arbitro' });
    prisma.utilizador.update.mockResolvedValue({
      id: 2,
      nome: 'Ana',
      telefone: '912345678',
      email: 'ana@grib.pt',
      role: 'utilizador',
      funcaoPadrao: 'mesa',
      createdAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/admin/utilizadores/2/funcao-padrao')
      .send({ funcaoPadrao: 'mesa' });

    expect(res.status).toBe(200);
    expect(res.body.funcaoPadrao).toBe('mesa');
    expect(prisma.utilizador.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { funcaoPadrao: 'mesa' },
      })
    );
  });
});