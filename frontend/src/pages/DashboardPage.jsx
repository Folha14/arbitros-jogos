import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { utilizador } = useAuth();
  const [registos, setRegistos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [ganhosMes, setGanhosMes] = useState(0);
  const [ganhosTotais, setGanhosTotais] = useState(0);
  const [totalJogos, setTotalJogos] = useState(0);

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data } = await api.get('/registos');
        const resultados = data.resultados || [];
        setRegistos(resultados);

        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();

        let totalMes = 0;
        let totalGeral = 0;

        resultados.forEach((r) => {
          const val = parseFloat(r.valor || 0);
          if (isNaN(val)) return;

          totalGeral += val;

          if (r.dataJogo) {
            let dataJ;
            if (r.dataJogo.includes('-')) {
              const partes = r.dataJogo.split('-');
              dataJ = new Date(partes[0], partes[1] - 1, partes[2] || 1);
            } else if (r.dataJogo.includes('/')) {
              const partes = r.dataJogo.split('/');
              dataJ = new Date(partes[2], partes[1] - 1, partes[0]);
            } else {
              dataJ = new Date(r.dataJogo);
            }

            if (!isNaN(dataJ.getTime())) {
              if (dataJ.getFullYear() === anoAtual && dataJ.getMonth() === mesAtual) {
                totalMes += val;
              }
            }
          }
        });

        setGanhosMes(totalMes);
        setGanhosTotais(totalGeral);
        setTotalJogos(resultados.length);
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      } finally {
        setACarregar(false);
      }
    }
    carregarDados();
  }, []);

  return (
    <div className="page-container">
      <div className="user-dashboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Área do Utilizador</h1>
            <p>Olá, <strong>{utilizador?.nome || 'Árbitro'}</strong>. Consulta o teu resumo e acede às ferramentas principais.</p>
          </div>
          <span className="role-badge">Árbitro</span>
        </div>

        {/* Linha de Estatísticas (SaaS Stats Panel) */}
        <div className="stats-panel-row" style={{ marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="stat-card">
            <span className="stat-card-title">Ganhos Acumulados (Total)</span>
            <span className="stat-card-value" style={{ color: 'var(--primary-green)' }}>{ganhosTotais.toFixed(2)} €</span>
            <span className="stat-card-desc">Total acumulado de todos os jogos</span>
          </div>

          <div className="stat-card">
            <span className="stat-card-title">Ganhos (Este Mês)</span>
            <span className="stat-card-value">{ganhosMes.toFixed(2)} €</span>
            <span className="stat-card-desc">Calculado com base nos jogos deste mês</span>
          </div>

          <div className="stat-card">
            <span className="stat-card-title">Total de Jogos</span>
            <span className="stat-card-value">{totalJogos}</span>
            <span className="stat-card-desc">Histórico total nesta época</span>
          </div>
        </div>

        <div className="user-dashboard-links" style={{ marginTop: '2rem' }}>
          <Link to="/registar" className="user-dashboard-card">
            <h2>Registar Arbitragem</h2>
            <p>Regista um novo jogo na tua conta em poucos segundos.</p>
          </Link>

          <Link to="/historico" className="user-dashboard-card">
            <h2>Histórico</h2>
            <p>Consulta a listagem de todos os teus jogos apontados.</p>
          </Link>

          <Link to="/jogos" className="user-dashboard-card">
            <h2>Calendário</h2>
            <p>Vê os próximos jogos agendados da FPB.</p>
          </Link>
        </div>

        {/* Secção de Arbitragens Recentes */}
        <div style={{ marginTop: '2.5rem' }}>
          <h2>Arbitragens Recentes</h2>
          {aCarregar ? (
            <p>A carregar arbitragens...</p>
          ) : registos.length === 0 ? (
            <div className="jogo-card" style={{ justifyContent: 'center', color: '#8a8a86' }}>
              Ainda não registaste nenhuma arbitragem.
            </div>
          ) : (
            <div className="jogo-card-list">
              {registos.slice(0, 3).map((r) => (
                <div key={r.id} className="jogo-card">
                  <div className="jogo-card-info">
                    <span className="jogo-card-teams">{r.equipaCasa} vs {r.equipaFora}</span>
                    <span className="jogo-card-details">
                      <span>📅 {r.dataJogo}</span>
                      {r.horaJogo && <span>🕒 {r.horaJogo}</span>}
                      {r.pavilhao && <span>📍 {r.pavilhao}</span>}
                      <span>🏷️ {r.competicao?.nome || r.competicao?.escalao || 'Geral'}</span>
                    </span>
                  </div>
                  <div className="jogo-card-meta">
                    <span className="status-badge confirmado">
                      {r.funcao === 'arbitro1' ? 'Árbitro' : 'Mesa'}
                    </span>
                    <span className="jogo-card-val">
                      {r.valor != null ? `${parseFloat(r.valor).toFixed(2)} €` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}