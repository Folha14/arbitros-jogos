import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function formatarFuncao(funcao) {
  if (funcao === 'arbitro1') return 'Árbitro';
  if (funcao === 'mesa') return 'Mesa';
  return funcao;
}

export default function HistoricoPage() {
  const { utilizador } = useAuth();
  const isAdmin = utilizador?.role === 'admin';

  const [registos, setRegistos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroData, setFiltroData] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState('');
  const [filtroUtilizador, setFiltroUtilizador] = useState('');

  const [utilizadores, setUtilizadores] = useState([]);

  useEffect(() => {
    carregarDados();
    if (isAdmin) carregarUtilizadores();
  }, [isAdmin]);

  async function carregarDados(filtrosSobreposicao = {}) {
    setACarregar(true);
    setErro('');
    try {
      const params = {};
      const dataVal = 'data' in filtrosSobreposicao ? filtrosSobreposicao.data : filtroData;
      const funcaoVal = 'funcao' in filtrosSobreposicao ? filtrosSobreposicao.funcao : filtroFuncao;
      const utilizadorVal = 'utilizador' in filtrosSobreposicao ? filtrosSobreposicao.utilizador : filtroUtilizador;

      if (dataVal) params.data = dataVal;
      if (funcaoVal) params.funcao = funcaoVal;
      if (isAdmin && utilizadorVal) params.utilizador = utilizadorVal;

      const { data } = await api.get('/registos', { params });
      setRegistos(data.resultados || []);
    } catch (err) {
      setErro('Erro ao carregar o histórico.');
    } finally {
      setACarregar(false);
    }
  }

  async function carregarUtilizadores() {
    try {
      const { data } = await api.get('/admin/utilizadores');
      setUtilizadores(data.resultados || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function exportarCSV() {
    try {
      const params = {};
      if (filtroData) params.data = filtroData;
      if (filtroFuncao) params.funcao = filtroFuncao;
      if (isAdmin && filtroUtilizador) params.utilizador = filtroUtilizador;

      const { data } = await api.get('/registos/export', {
        responseType: 'blob',
        params,
      });

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historico_registos.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErro('Erro ao exportar CSV.');
    }
  }

  function aplicarFiltros(e) {
    e.preventDefault();
    carregarDados();
  }

  function limparFiltros() {
    setFiltroData('');
    setFiltroFuncao('');
    setFiltroUtilizador('');
    carregarDados({ data: '', funcao: '', utilizador: '' });
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1>{isAdmin ? 'Histórico Global' : 'Histórico de Registos'}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Consulta e descarrega as arbitragens efetuadas.</p>
        </div>
        <button onClick={exportarCSV} className="btn-primary">
          📥 Exportar para Excel
        </button>
      </div>

      {erro && <p className="error-msg">{erro}</p>}

      <form onSubmit={aplicarFiltros} className="form-row" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label>Data</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Função</label>
          <select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)}>
            <option value="">Todas</option>
            <option value="arbitro1">Árbitro</option>
            <option value="mesa">Mesa</option>
          </select>
        </div>

        {isAdmin && (
          <div className="form-group">
            <label>Utilizador</label>
            <select value={filtroUtilizador} onChange={(e) => setFiltroUtilizador(e.target.value)}>
              <option value="">Todos</option>
              {utilizadores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group" style={{ display: 'flex', gap: '0.5rem', flexFlow: 'row nowrap', alignItems: 'center', minWidth: 'auto', flex: 'none' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.62rem 1.25rem' }}>
            Filtrar
          </button>
          <button type="button" className="btn-cancel" onClick={limparFiltros} style={{ padding: '0.62rem 1.25rem' }}>
            Limpar
          </button>
        </div>
      </form>

      {aCarregar ? (
        <p>A carregar histórico...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Utilizador</th>}
                <th>Data</th>
                <th>Hora</th>
                <th>Jogo</th>
                <th>Competição</th>
                <th>Função</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {registos.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-pale)' }}>
                    Sem registos correspondentes aos filtros aplicados.
                  </td>
                </tr>
              ) : (
                registos.map((r) => (
                  <tr key={r.id}>
                    {isAdmin && (
                      <td>
                        <strong>{r.utilizador?.nome || '-'}</strong>
                        <br />
                        <small style={{ color: 'var(--text-pale)' }}>{r.utilizador?.email || ''}</small>
                      </td>
                    )}
                    <td>{r.dataJogo}</td>
                    <td>{r.horaJogo || '-'}</td>
                    <td>
                      <strong>{r.equipaCasa}</strong> <span style={{ color: 'var(--text-pale)' }}>vs</span> <strong>{r.equipaFora}</strong>
                    </td>
                    <td>{r.competicao?.nome || r.competicao?.escalao || '-'}</td>
                    <td>
                      <span className="status-badge confirmado">
                        {formatarFuncao(r.funcao)}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>
                      {r.valor != null ? `${parseFloat(r.valor).toFixed(2)} €` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}