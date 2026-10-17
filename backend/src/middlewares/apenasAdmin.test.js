const apenasAdmin = require('./apenasAdmin');

function criarRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('apenasAdmin', () => {
  it('bloqueia utilizador sem role admin', () => {
    const req = { utilizador: { role: 'utilizador' } };
    const res = criarRes();
    const next = jest.fn();

    apenasAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('bloqueia se nao houver req.utilizador', () => {
    const req = {};
    const res = criarRes();
    const next = jest.fn();

    apenasAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite utilizador com role admin', () => {
    const req = { utilizador: { role: 'admin' } };
    const res = criarRes();
    const next = jest.fn();

    apenasAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});