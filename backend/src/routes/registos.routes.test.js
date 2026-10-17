const express = require('express');
const request = require('supertest');

jest.mock('../controllers/registosController', () => ({
  criarRegisto: (req, res) => res.status(201).json({ ok: true }),
  listarRegistos: (req, res) => res.json({ resultados: [] }),
  exportarRegistos: (req, res) => res.send('csv'),
}));

function montarApp(roleSimulado) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.utilizador = { id: 1, role: roleSimulado };
    next();
  });

  const bloquearAdmin = require('../middlewares/bloquearAdmin');
  const { criarRegisto, listarRegistos, exportarRegistos } = require('../controllers/registosController');

  const router = express.Router();
  router.get('/export', exportarRegistos);
  router.post('/', bloquearAdmin, criarRegisto);
  router.get('/', listarRegistos);

  app.use('/api/registos', router);
  return app;
}

describe('POST /api/registos - permissoes por role', () => {
  it('admin recebe 403 ao tentar criar registo', async () => {
    const app = montarApp('admin');
    const res = await request(app).post('/api/registos').send({ jogo_id: 1, funcao: 'arbitro1' });

    expect(res.status).toBe(403);
  });

  it('utilizador normal consegue criar registo', async () => {
    const app = montarApp('utilizador');
    const res = await request(app).post('/api/registos').send({ jogo_id: 1, funcao: 'arbitro1' });

    expect(res.status).toBe(201);
  });
});