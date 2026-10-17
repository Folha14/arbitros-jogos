import { useEffect, useState } from 'react';
import api from '../services/api';

function normalizarEquipa(nome) {
  const texto = nome.trim();
  if (!texto) return '';
  if (texto.toLowerCase() === 'grib') return 'Brandoense';
  return texto;
}

export default function AdminEscalaoValoresPage() {
  const [valores, setValores] = useState([]);
  const [novaEquipa, setNovaEquipa] = useState('');
  const [novoEscalao, setNovoEscalao] = useState('');
  const [novoArbitro, setNovoArbitro] = useState('');
  const [novoMesa, setNovoMesa] = useState('');
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [rascunho, setRascunho] = useState({
    equipa: '',
    escalao: '',
    valor_arbitro: '',
    valor_mesa: '',
  });

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setErro('');
      const { data } = await api.get('/escalao-valores');
      setValores(data);
    } catch (err) {
      setErro('Erro ao carregar valores.');
    }
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setRascunho({
      equipa: item.equipa,
      escalao: item.escalao,
      valor_arbitro: String(item.valor_arbitro),
      valor_mesa: String(item.valor_mesa),
    });
    setErro('');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setRascunho({
      equipa: '',
      escalao: '',
      valor_arbitro: '',
      valor_mesa: '',
    });
    setErro('');
  }

  async function confirmarEdicao(id) {
    const equipa = normalizarEquipa(rascunho.equipa);
    const escalao = rascunho.escalao.trim();
    const valorArbitro = parseFloat(rascunho.valor_arbitro);
    const valorMesa = parseFloat(rascunho.valor_mesa);

    if (!equipa || !escalao) {
      setErro('Equipa e escalao sao obrigatorios.');
      return;
    }

    if (Number.isNaN(valorArbitro) || Number.isNaN(valorMesa)) {
      setErro('Valores invalidos.');
      return;
    }

    try {
      await api.put(`/escalao-valores/${id}`, {
        equipa,
        escalao,
        valor_arbitro: valorArbitro,
        valor_mesa: valorMesa,
      });
      setErro('');
      setEditandoId(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao guardar alteracoes.');
    }
  }

  async function adicionarEscalao(e) {
    e.preventDefault();

    const equipa = normalizarEquipa(novaEquipa);
    const escalao = novoEscalao.trim();
    const valorArbitro = parseFloat(novoArbitro);
    const valorMesa = parseFloat(novoMesa);

    if (!equipa || !escalao) {
      setErro('Equipa e escalao sao obrigatorios.');
      return;
    }

    if (Number.isNaN(valorArbitro) || Number.isNaN(valorMesa)) {
      setErro('Valores invalidos.');
      return;
    }

    try {
      await api.post('/escalao-valores', {
        equipa,
        escalao,
        valor_arbitro: valorArbitro,
        valor_mesa: valorMesa,
      });
      setNovaEquipa('');
      setNovoEscalao('');
      setNovoArbitro('');
      setNovoMesa('');
      setErro('');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar registo.');
    }
  }

  async function removerEscalao(id) {
    if (!window.confirm('Tem a certeza que quer remover este registo?')) return;

    try {
      await api.delete(`/escalao-valores/${id}`);
      setErro('');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao remover registo.');
    }
  }

  return (
    <div className="container">
      <h1>Gestao de Valores por Equipa e Escalao</h1>
      {erro && <p className="error-msg">{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>Equipa</th>
            <th>Escalao</th>
            <th>Valor Arbitro</th>
            <th>Valor Mesa</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {valores.map((item) => {
            const emEdicao = editandoId === item.id;
            return (
              <tr key={item.id} className={emEdicao ? 'row-editing' : ''}>
                <td>
                  {emEdicao ? (
                    <input
                      className="table-edit-input"
                      value={rascunho.equipa}
                      onChange={(e) => setRascunho((prev) => ({ ...prev, equipa: e.target.value }))}
                    />
                  ) : (
                    <strong>{item.equipa}</strong>
                  )}
                </td>
                <td>
                  {emEdicao ? (
                    <input
                      className="table-edit-input"
                      value={rascunho.escalao}
                      onChange={(e) => setRascunho((prev) => ({ ...prev, escalao: e.target.value }))}
                    />
                  ) : (
                    item.escalao
                  )}
                </td>
                <td>
                  {emEdicao ? (
                    <div className="currency-input" style={{ maxWidth: '110px' }}>
                      <span>€</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rascunho.valor_arbitro}
                        onChange={(e) =>
                          setRascunho((prev) => ({
                            ...prev,
                            valor_arbitro: e.target.value.replace(',', '.'),
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <strong style={{ color: 'var(--primary-green)', fontSize: '0.92rem' }}>
                      {parseFloat(item.valor_arbitro).toFixed(2)} €
                    </strong>
                  )}
                </td>
                <td>
                  {emEdicao ? (
                    <div className="currency-input" style={{ maxWidth: '110px' }}>
                      <span>€</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rascunho.valor_mesa}
                        onChange={(e) =>
                          setRascunho((prev) => ({
                            ...prev,
                            valor_mesa: e.target.value.replace(',', '.'),
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <strong style={{ color: 'var(--primary-green)', fontSize: '0.92rem' }}>
                      {parseFloat(item.valor_mesa).toFixed(2)} €
                    </strong>
                  )}
                </td>
                <td>
                  {emEdicao ? (
                    <div className="row-actions">
                      <button className="btn-confirm" onClick={() => confirmarEdicao(item.id)}>
                        Guardar
                      </button>
                      <button className="btn-cancel" onClick={cancelarEdicao}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button className="btn-edit" onClick={() => iniciarEdicao(item)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => removerEscalao(item.id)}>
                        Remover
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Adicionar novo registo</h2>
      <form onSubmit={adicionarEscalao} className="form-row">
        <div className="form-group">
          <label>Equipa</label>
          <input
            value={novaEquipa}
            onChange={(e) => setNovaEquipa(e.target.value)}
            placeholder="Ex.: Brandoense"
            required
          />
        </div>

        <div className="form-group">
          <label>Escalao</label>
          <input
            value={novoEscalao}
            onChange={(e) => setNovoEscalao(e.target.value)}
            placeholder="Ex.: Sub 14 Masculino B"
            required
          />
        </div>

        <div className="form-group">
          <label>Valor Arbitro</label>
          <div className="currency-input">
            <span>€</span>
            <input
              type="text"
              inputMode="decimal"
              value={novoArbitro}
              onChange={(e) => setNovoArbitro(e.target.value.replace(',', '.'))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Valor Mesa</label>
          <div className="currency-input">
            <span>€</span>
            <input
              type="text"
              inputMode="decimal"
              value={novoMesa}
              onChange={(e) => setNovoMesa(e.target.value.replace(',', '.'))}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Adicionar
        </button>
      </form>
    </div>
  );
}