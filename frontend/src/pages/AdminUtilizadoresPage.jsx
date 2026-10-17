import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminUtilizadoresPage() {
  const { utilizador: utilizadorLogado } = useAuth();
  const [utilizadores, setUtilizadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aPromoverId, setAPromoverId] = useState(null);
  const [aAtualizarId, setAAtualizarId] = useState(null);
  const [aRemoverId, setARemoverId] = useState(null);

  async function carregarUtilizadores() {
    try {
      setErro('');
      const { data } = await api.get('/admin/utilizadores');
      setUtilizadores(data.resultados || []);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar utilizadores.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  async function promoverParaAdmin(id) {
    try {
      setAPromoverId(id);
      await api.patch(`/admin/utilizadores/${id}/promover`);
      await carregarUtilizadores();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao promover utilizador.');
    } finally {
      setAPromoverId(null);
    }
  }

  async function alterarFuncaoPadrao(id, novaFuncao) {
    try {
      setAAtualizarId(id);
      await api.patch(`/admin/utilizadores/${id}/funcao-padrao`, { funcaoPadrao: novaFuncao });
      await carregarUtilizadores();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar função padrão.');
    } finally {
      setAAtualizarId(null);
    }
  }

  async function removerUtilizador(id) {
    if (utilizadorLogado?.id === id) {
      setErro('Não pode remover a sua própria conta.');
      return;
    }

    if (!window.confirm('Tem a certeza que deseja remover este utilizador? Esta ação irá apagar também todos os seus registos de arbitragem.')) {
      return;
    }

    try {
      setARemoverId(id);
      await api.delete(`/admin/utilizadores/${id}`);
      await carregarUtilizadores();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao remover utilizador.');
    } finally {
      setARemoverId(null);
    }
  }

  if (carregando) return <p>A carregar utilizadores...</p>;

  return (
    <div className="container">
      <h1>Gestão de Utilizadores</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
        Administra as contas dos árbitros, atualiza as funções padrão, promove utilizadores ou remove contas do sistema.
      </p>

      {erro && <p className="error-msg">{erro}</p>}

      {utilizadores.length === 0 ? (
        <p>Não existem utilizadores registados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Função padrão</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.map((u) => {
                const ehProprio = utilizadorLogado?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="user-avatar-cell">
                        <div className="user-avatar">
                          {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{u.nome}</strong> {ehProprio && <small style={{ color: 'var(--primary-green)', fontWeight: 600, marginLeft: '4px' }}>(Tu)</small>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.telefone || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role === 'admin' ? 'ADMIN' : 'UTILIZADOR'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="table-select"
                        value={u.funcaoPadrao || 'arbitro'}
                        disabled={aAtualizarId === u.id}
                        onChange={(e) => alterarFuncaoPadrao(u.id, e.target.value)}
                      >
                        <option value="arbitro">Árbitro</option>
                        <option value="mesa">Mesa</option>
                      </select>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        {u.role !== 'admin' ? (
                          <button
                            className="btn-edit"
                            onClick={() => promoverParaAdmin(u.id)}
                            disabled={aPromoverId === u.id}
                          >
                            {aPromoverId === u.id ? 'A promover...' : 'Promover'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-pale)', padding: '0.45rem 0.6rem', fontWeight: 600 }}>
                            Admin
                          </span>
                        )}
                        {!ehProprio && (
                          <button
                            className="btn-danger"
                            onClick={() => removerUtilizador(u.id)}
                            disabled={aRemoverId === u.id}
                          >
                            {aRemoverId === u.id ? 'A remover...' : 'Remover'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}