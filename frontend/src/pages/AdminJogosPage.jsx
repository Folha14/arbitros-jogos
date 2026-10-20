import { useEffect, useState } from 'react';
import api from '../services/api';

function obterDataAtualLisboa() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function jogoVazio() {
  return {
    dataJogo: '',
    horaJogo: '',
    equipaCasa: '',
    equipaFora: '',
    competicaoId: '',
    pavilhao: '',
    localidade: '',
    fonteUrl: '',
  };
}

function formatarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) return data || '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function AdminJogosPage() {
  const [jogos, setJogos] = useState([]);
  const [competicoes, setCompeticoes] = useState([]);
  const [rascunho, setRascunho] = useState(jogoVazio);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [aApagarId, setAApagarId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregarDados() {
    try {
      setErro('');
      const { data } = await api.get('/admin/jogos');
      setJogos(data.jogos);
      setCompeticoes(data.competicoes);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível carregar os jogos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setRascunho((atual) => ({ ...atual, [name]: value }));
  }

  function iniciarEdicao(jogo) {
    setEditandoId(jogo.id);
    setRascunho({
      dataJogo: jogo.dataJogo,
      horaJogo: jogo.horaJogo || '',
      equipaCasa: jogo.equipaCasa,
      equipaFora: jogo.equipaFora,
      competicaoId: String(jogo.competicaoId),
      pavilhao: jogo.pavilhao || '',
      localidade: jogo.localidade || '',
      fonteUrl: jogo.fonteUrl || '',
    });
    setErro('');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setRascunho(jogoVazio());
    setErro('');
  }

  async function guardarJogo(event) {
    event.preventDefault();
    setErro('');

    if (rascunho.dataJogo < obterDataAtualLisboa()) {
      setErro('A data do jogo não pode ser anterior à data atual.');
      return;
    }

    if (
      rascunho.horaJogo &&
      jogos.some((jogo) =>
        jogo.id !== editandoId &&
        jogo.dataJogo === rascunho.dataJogo &&
        jogo.horaJogo === rascunho.horaJogo
      )
    ) {
      setErro('Já existe outro jogo na mesma data e hora.');
      return;
    }

    setAGuardar(true);
    const payload = {
      ...rascunho,
      competicaoId: Number(rascunho.competicaoId),
      horaJogo: rascunho.horaJogo || null,
      pavilhao: rascunho.pavilhao || null,
      localidade: rascunho.localidade || null,
      fonteUrl: rascunho.fonteUrl || null,
    };

    try {
      if (editandoId == null) {
        await api.post('/admin/jogos', payload);
      } else {
        await api.put(`/admin/jogos/${editandoId}`, payload);
      }
      cancelarEdicao();
      await carregarDados();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível guardar o jogo.');
    } finally {
      setAGuardar(false);
    }
  }

  async function apagarJogo(jogo) {
    const confirmado = window.confirm(
      `Apagar ${jogo.equipaCasa} vs ${jogo.equipaFora}? O scraper poderá voltar a importar este jogo.`
    );
    if (!confirmado) return;

    setAApagarId(jogo.id);
    setErro('');
    try {
      await api.delete(`/admin/jogos/${jogo.id}`);
      await carregarDados();
      if (editandoId === jogo.id) cancelarEdicao();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível apagar o jogo.');
    } finally {
      setAApagarId(null);
    }
  }

  if (carregando) return <p className="container">A carregar jogos...</p>;

  return (
    <div className="container">
      <h1>Gestão de Jogos</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Cria e gere jogos do calendário. Os jogos importados podem voltar a aparecer após uma atualização do scraper.
      </p>

      {erro && <p className="error-msg" role="alert">{erro}</p>}

      <h2>{editandoId == null ? 'Adicionar jogo' : 'Editar jogo'}</h2>
      <form onSubmit={guardarJogo} className="form-row">
        <div className="form-group">
          <label htmlFor="jogo-data">Data</label>
          <input
            id="jogo-data"
            name="dataJogo"
            type="date"
            value={rascunho.dataJogo}
            onChange={atualizarCampo}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-hora">Hora (opcional)</label>
          <input
            id="jogo-hora"
            name="horaJogo"
            type="time"
            value={rascunho.horaJogo}
            onChange={atualizarCampo}
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-casa">Equipa da casa</label>
          <input
            id="jogo-casa"
            name="equipaCasa"
            value={rascunho.equipaCasa}
            onChange={atualizarCampo}
            maxLength={120}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-fora">Equipa visitante</label>
          <input
            id="jogo-fora"
            name="equipaFora"
            value={rascunho.equipaFora}
            onChange={atualizarCampo}
            maxLength={120}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-competicao">Competição</label>
          <select
            id="jogo-competicao"
            name="competicaoId"
            value={rascunho.competicaoId}
            onChange={atualizarCampo}
            required
          >
            <option value="">Seleciona uma competição</option>
            {competicoes.map((competicao) => (
              <option key={competicao.id} value={competicao.id}>
                {[competicao.nome, competicao.escalao, competicao.epoca].filter(Boolean).join(' · ')}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="jogo-pavilhao">Pavilhão (opcional)</label>
          <input
            id="jogo-pavilhao"
            name="pavilhao"
            value={rascunho.pavilhao}
            onChange={atualizarCampo}
            maxLength={150}
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-localidade">Localidade (opcional)</label>
          <input
            id="jogo-localidade"
            name="localidade"
            value={rascunho.localidade}
            onChange={atualizarCampo}
            maxLength={150}
          />
        </div>
        <div className="form-group">
          <label htmlFor="jogo-fonte">URL da fonte (opcional)</label>
          <input
            id="jogo-fonte"
            name="fonteUrl"
            type="url"
            value={rascunho.fonteUrl}
            onChange={atualizarCampo}
            placeholder="https://..."
          />
        </div>
        <div className="row-actions">
          <button className="btn-confirm" type="submit" disabled={aGuardar || competicoes.length === 0}>
            {aGuardar ? 'A guardar...' : editandoId == null ? 'Criar jogo' : 'Guardar alterações'}
          </button>
          {editandoId != null && (
            <button className="btn-cancel" type="button" onClick={cancelarEdicao} disabled={aGuardar}>
              Cancelar
            </button>
          )}
        </div>
        {competicoes.length === 0 && (
          <p className="error-msg">Não existem competições disponíveis para associar a um jogo.</p>
        )}
      </form>

      <h2 style={{ marginTop: '2rem' }}>Jogos existentes</h2>
      {jogos.length === 0 ? (
        <p>Não existem jogos registados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Data / hora</th>
                <th>Jogo</th>
                <th>Competição</th>
                <th>Local</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {jogos.map((jogo) => (
                <tr key={jogo.id}>
                  <td>
                    <strong>{formatarData(jogo.dataJogo)}</strong>
                    <br />
                    {jogo.horaJogo || 'Hora por definir'}
                  </td>
                  <td>{jogo.equipaCasa} vs {jogo.equipaFora}</td>
                  <td>
                    {jogo.competicao
                      ? [jogo.competicao.nome, jogo.competicao.escalao].filter(Boolean).join(' · ')
                      : '—'}
                  </td>
                  <td>{[jogo.pavilhao, jogo.localidade].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-edit"
                        type="button"
                        onClick={() => iniciarEdicao(jogo)}
                        disabled={aGuardar || aApagarId === jogo.id}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger"
                        type="button"
                        onClick={() => apagarJogo(jogo)}
                        disabled={aGuardar || aApagarId === jogo.id}
                      >
                        {aApagarId === jogo.id ? 'A apagar...' : 'Apagar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}