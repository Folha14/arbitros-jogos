const bloquearAdmin = require('./bloquearAdmin');

function criarRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('bloquearAdmin', () => {
  it('bloqueia utilizador com role admin', () => {
    const req = { utilizador: { role: 'admin' } };
    const res = criarRes();
    const next = jest.fn();

    bloquearAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite utilizador normal', () => {
    const req = { utilizador: { role: 'utilizador' } };
    const res = criarRes();
    const next = jest.fn();

    bloquearAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});