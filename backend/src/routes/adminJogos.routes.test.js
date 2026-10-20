const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  jogoFPB: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
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
const { obterDataAtualLisboa } = require('../utils/dataAtualLisboa');

const JWT_SECRET_TESTE = 'segredo-sintetico-para-testes';
function dataRelativaLisboa(dias) {
  const data = new Date(`${obterDataAtualLisboa()}T00:00:00.000Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

const jogoPayload = {
  dataJogo: dataRelativaLisboa(1),
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
  prisma.jogoFPB.findFirst.mockResolvedValue(null);
  prisma.jogoFPB.create.mockResolvedValue({ id: 12, ...jogoPayload });
  prisma.jogoFPB.update.mockResolvedValue({ id: 12, ...jogoPayload });
  prisma.jogoFPB.delete.mockResolvedValue({ id: 12 });
  prisma.competicao.findMany.mockResolvedValue([]);
  prisma.competicao.findUnique.mockResolvedValue({ id: jogoPayload.competicaoId });
});

describe('/api/admin/jogos', () => {
  it('calcula a data de calendário no fuso Europe/Lisbon', () => {
    expect(obterDataAtualLisboa(new Date('2026-10-20T22:59:00.000Z'))).toBe('2026-10-20');
    expect(obterDataAtualLisboa(new Date('2026-10-20T23:01:00.000Z'))).toBe('2026-10-21');
    expect(obterDataAtualLisboa(new Date('2026-01-01T00:30:00.000Z'))).toBe('2026-01-01');
  });

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

  it('permite criar jogo para a data atual em Lisboa', async () => {
    const payload = { ...jogoPayload, dataJogo: obterDataAtualLisboa() };

    const res = await comToken(criarToken()).post('/api/admin/jogos').send(payload);

    expect(res.status).toBe(201);
    expect(prisma.jogoFPB.create).toHaveBeenCalled();
  });

  it('rejeita a criação de um jogo com data passada sem escrever', async () => {
    const payload = { ...jogoPayload, dataJogo: '2020-01-15' };

    const res = await comToken(criarToken()).post('/api/admin/jogos').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('A data do jogo não pode ser anterior à data atual.');
    expect(prisma.competicao.findUnique).not.toHaveBeenCalled();
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('rejeita atualização para data passada sem escrever', async () => {
    const payload = { ...jogoPayload, dataJogo: '2020-01-15' };

    const res = await comToken(criarToken()).put('/api/admin/jogos/12').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('A data do jogo não pode ser anterior à data atual.');
    expect(prisma.competicao.findUnique).not.toHaveBeenCalled();
    expect(prisma.jogoFPB.update).not.toHaveBeenCalled();
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

  it('rejeita criação com data e hora já usadas antes de escrever', async () => {
    prisma.jogoFPB.findFirst.mockResolvedValue({ id: 13 });

    const res = await comToken(criarToken()).post('/api/admin/jogos').send(jogoPayload);

    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Já existe outro jogo na mesma data e hora.');
    expect(prisma.jogoFPB.findFirst).toHaveBeenCalledWith({
      where: { dataJogo: jogoPayload.dataJogo, horaJogo: jogoPayload.horaJogo },
      select: { id: true },
    });
    expect(prisma.jogoFPB.create).not.toHaveBeenCalled();
  });

  it('não verifica conflito de horário quando a hora é nula', async () => {
    const payload = { ...jogoPayload, horaJogo: null };

    const res = await comToken(criarToken()).post('/api/admin/jogos').send(payload);

    expect(res.status).toBe(201);
    expect(prisma.jogoFPB.findFirst).not.toHaveBeenCalled();
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
    expect(prisma.jogoFPB.findFirst).toHaveBeenCalledWith({
      where: {
        dataJogo: alteracao.dataJogo,
        horaJogo: alteracao.horaJogo,
        id: { not: 12 },
      },
      select: { id: true },
    });
  });

  it('rejeita atualização quando outro jogo ocupa a mesma data e hora', async () => {
    prisma.jogoFPB.findFirst.mockResolvedValue({ id: 13 });

    const res = await comToken(criarToken())
      .put('/api/admin/jogos/12')
      .send(jogoPayload);

    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Já existe outro jogo na mesma data e hora.');
    expect(prisma.jogoFPB.findFirst).toHaveBeenCalledWith({
      where: {
        dataJogo: jogoPayload.dataJogo,
        horaJogo: jogoPayload.horaJogo,
        id: { not: 12 },
      },
      select: { id: true },
    });
    expect(prisma.jogoFPB.update).not.toHaveBeenCalled();
  });

  it('converte conflito de unicidade da base de dados na atualização em 409', async () => {
    prisma.jogoFPB.update.mockRejectedValue({ code: 'P2002' });

    const res = await comToken(criarToken())
      .put('/api/admin/jogos/12')
      .send(jogoPayload);

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/data e hora/i);
  });

  it('não verifica conflito de horário na atualização quando a hora é nula', async () => {
    const payload = { ...jogoPayload, horaJogo: null };

    const res = await comToken(criarToken()).put('/api/admin/jogos/12').send(payload);

    expect(res.status).toBe(200);
    expect(prisma.jogoFPB.findFirst).not.toHaveBeenCalled();
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