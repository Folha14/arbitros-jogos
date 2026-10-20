const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  jogoFPB: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  competicao: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const prisma = require('../config/database');
const { gerarHashJogo } = require('../utils/gerarHashJogo');

const JWT_SECRET_TESTE = 'segredo-sintetico-para-testes';
const jogoPayload = {
  dataJogo: '2026-11-07',
  horaJogo: '18:30',
  equipaCasa: 'Equipa da Casa',
  equipaFora: 'Equipa Visitante',
  competicaoId: 7,
  pavilhao: 'Pavilhão de Teste',
  localidade: 'Localidade de Teste',
  fonteUrl: 'https://example.test/jogo',
};

function criarToken(role = 'admin') {
  return jwt.sign({ id: 1, role }, JWT_SECRET_TESTE);
}

function montarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/jogos', require('./adminJogos.routes'));
  return app;
}

function comToken(token, app = montarApp()) {
  const cliente = request(app);
  const cabecalho = (chamada) => chamada.set('Authorization', `Bearer ${token}`);
  return {
    get: (caminho) => cabecalho(cliente.get(caminho)),
    post: (caminho) => cabecalho(cliente.post(caminho)),
    put: (caminho) => cabecalho(cliente.put(caminho)),
    delete: (caminho) => cabecalho(cliente.delete(caminho)),
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET_TESTE;
  jest.clearAllMocks();
  prisma.jogoFPB.findMany.mockResolvedValue([]);
  prisma.jogoFPB.create.mockResolvedValue({ id: 12, ...jogoPayload });
  prisma.jogoFPB.update.mockResolvedValue({ id: 12, ...jogoPayload });
  prisma.jogoFPB.delete.mockResolvedValue({ id: 12 });
  prisma.competicao.findMany.mockResolvedValue([]);
  prisma.competicao.findUnique.mockResolvedValue({ id: jogoPayload.competicaoId });
});

describe('/api/admin/jogos', () => {
  it('exige autenticação', async () => {
    const res = await request(montarApp()).get('/api/admin/jogos');

    expect(res.status).toBe(401);
    expect(prisma.jogoFPB.findMany).not.toHaveBeenCalled();
  });

  it('bloqueia utilizador autenticado sem role admin antes de qualquer escrita', async () => {
    const res = await comToken(criarToken('utilizador'))
      .post('/api/admin/jogos')
      .send(jogoPayload);

    expect(res.status).toBe(403);
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('lista jogos e competições para admin', async () => {
    const jogo = { id: 12, ...jogoPayload, competicao: { id: 7, nome: 'Taça' } };
    const competicao = { id: 7, nome: 'Taça', escalao: 'Sénior', epoca: '2026/2027' };
    prisma.jogoFPB.findMany.mockResolvedValue([jogo]);
    prisma.competicao.findMany.mockResolvedValue([competicao]);

    const res = await comToken(criarToken()).get('/api/admin/jogos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ jogos: [expect.objectContaining({ id: 12 })], competicoes: [competicao] });
  });

  it('cria jogo e calcula hash no servidor', async () => {
    const res = await comToken(criarToken())
      .post('/api/admin/jogos')
      .send(jogoPayload);

    expect(res.status).toBe(201);
    expect(prisma.jogoFPB.create).toHaveBeenCalledWith({
      data: {
        ...jogoPayload,
        hashUnico: gerarHashJogo(jogoPayload),
      },
      include: { competicao: true },
    });
  });

  it('rejeita payload inválido sem escrever na base de dados', async () => {
    const res = await comToken(criarToken())
      .post('/api/admin/jogos')
      .send({ ...jogoPayload, dataJogo: '2026-02-30' });

    expect(res.status).toBe(400);
    expect(prisma.competicao.findUnique).not.toHaveBeenCalled();
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('rejeita corpo com tipo inválido', async () => {
    const res = await comToken(criarToken())
      .post('/api/admin/jogos')
      .send(null);

    expect(res.status).toBe(400);
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('rejeita uma competição inexistente', async () => {
    prisma.competicao.findUnique.mockResolvedValue(null);

    const res = await comToken(criarToken())
      .post('/api/admin/jogos')
      .send(jogoPayload);

    expect(res.status).toBe(400);
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('devolve conflito quando a hash do jogo já existe', async () => {
    prisma.jogoFPB.create.mockRejectedValue({ code: 'P2002' });

    const res = await comToken(criarToken())
      .post('/api/admin/jogos')
      .send(jogoPayload);

    expect(res.status).toBe(409);
  });

  it('atualiza jogo existente e recalcula hash', async () => {
    const alteracao = { ...jogoPayload, equipaFora: 'Visitante Atualizado' };

    const res = await comToken(criarToken())
      .put('/api/admin/jogos/12')
      .send(alteracao);

    expect(res.status).toBe(200);
    expect(prisma.jogoFPB.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        ...alteracao,
        hashUnico: gerarHashJogo(alteracao),
      },
      include: { competicao: true },
    });
  });

  it('rejeita ID inválido em atualização e eliminação', async () => {
    const app = montarApp();
    const token = criarToken();

    const update = await comToken(token, app)
      .put('/api/admin/jogos/abc')
      .send(jogoPayload);
    const deletion = await comToken(token, app).delete('/api/admin/jogos/0');

    expect(update.status).toBe(400);
    expect(deletion.status).toBe(400);
    expect(prisma.jogoFPB.update).not.toHaveBeenCalled();
    expect(prisma.jogoFPB.delete).not.toHaveBeenCalled();
  });

  it('apaga jogo existente', async () => {
    const res = await comToken(criarToken()).delete('/api/admin/jogos/12');

    expect(res.status).toBe(204);
    expect(prisma.jogoFPB.delete).toHaveBeenCalledWith({ where: { id: 12 } });
  });

  it('devolve 404 ao apagar jogo inexistente', async () => {
    prisma.jogoFPB.delete.mockRejectedValue({ code: 'P2025' });

    const res = await comToken(criarToken()).delete('/api/admin/jogos/999');

    expect(res.status).toBe(404);
  });
});