import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function JogosCalendarioPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [jogos, setJogos] = useState([]);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  // Formato AAAA-MM-DD para verificar se o dia é hoje
  const hojeStr = useMemo(() => {
    const a = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    return `${a}-${m}-${d}`;
  }, []);

  useEffect(() => {
    async function buscarJogos() {
      setACarregar(true);
      setErro('');
      try {
        const { data } = await api.get('/jogos', {
          params: { ano, mes, casaGrib: 'true' },
        });
        setJogos(data);
      } catch (err) {
        console.error('Erro ao buscar jogos:', err);
        setErro('Não foi possível carregar os jogos.');
      } finally {
        setACarregar(false);
      }
    }

    buscarJogos();
    setDiaSelecionado(null);
  }, [ano, mes]);

  const jogosPorDia = useMemo(() => {
    const mapa = {};
    jogos.forEach((jogo) => {
      const dia = jogo.dataJogo;
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push(jogo);
    });
    return mapa;
  }, [jogos]);

  const diasDoCalendario = useMemo(() => {
    const primeiroDiaMes = new Date(ano, mes - 1, 1);
    const ultimoDiaMes = new Date(ano, mes, 0);
    const diasNoMes = ultimoDiaMes.getDate();
    const diaSemanaInicio = primeiroDiaMes.getDay();

    const dias = [];
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    for (let d = 1; d <= diasNoMes; d++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dias.push(dataStr);
    }
    return dias;
  }, [ano, mes]);

  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function mesSeguinte() {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  }

  return (
    <div className="container">
      <div className="jogos-calendario-page">
        <h1>Calendário de Jogos</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Visualiza os jogos marcados para a época selecionada e clica nos dias em destaque para ver detalhes.
        </p>

        <div className="calendario-controlos">
          <button type="button" onClick={mesAnterior}>&lt;</button>
          <span className="calendario-mes-atual">{NOMES_MESES[mes - 1]} {ano}</span>
          <button type="button" onClick={mesSeguinte}>&gt;</button>
        </div>

        {aCarregar && <p>A carregar jogos...</p>}
        {erro && <p className="error-msg">{erro}</p>}

        {!aCarregar && !erro && (
          <div className="calendario-grid">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="calendario-cabecalho">{dia}</div>
            ))}

            {diasDoCalendario.map((dataStr, index) => {
              if (!dataStr) {
                return <div key={`vazio-${index}`} className="calendario-dia calendario-dia-vazio" />;
              }

              const jogosDoDia = jogosPorDia[dataStr] || [];
              const numeroDia = parseInt(dataStr.split('-')[2], 10);
              const ehHoje = dataStr === hojeStr;

              return (
                <div
                  key={dataStr}
                  className={`calendario-dia ${jogosDoDia.length > 0 ? 'calendario-dia-com-jogos' : ''} ${diaSelecionado === dataStr ? 'calendario-dia-selecionado' : ''} ${ehHoje ? 'calendario-dia-hoje' : ''}`}
                  onClick={() => jogosDoDia.length > 0 && setDiaSelecionado(dataStr)}
                  style={ehHoje ? { boxShadow: 'inset 0 0 0 2px var(--border-mid)', background: '#fafaf8' } : undefined}
                >
                  <span className="calendario-numero-dia" style={ehHoje ? { color: 'var(--primary-green)', fontWeight: '700' } : undefined}>
                    {numeroDia} {ehHoje && '•'}
                  </span>
                  {jogosDoDia.length > 0 && (
                    <span className="calendario-badge">{jogosDoDia.length}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {diaSelecionado && jogosPorDia[diaSelecionado] && (
          <div className="calendario-detalhe-dia">
            <h3>Jogos em {diaSelecionado}</h3>
            <div className="jogo-card-list">
              {jogosPorDia[diaSelecionado].map((jogo) => (
                <div key={jogo.id} className="jogo-card">
                  <div className="jogo-card-info">
                    <span className="jogo-card-teams">{jogo.equipaCasa} vs {jogo.equipaFora}</span>
                    <span className="jogo-card-details">
                      <span>🕒 {jogo.horaJogo || '--:--'}</span>
                      {jogo.pavilhao && <span>📍 {jogo.pavilhao}</span>}
                      {jogo.competicao && <span>🏷️ {jogo.competicao.escalao}</span>}
                    </span>
                  </div>
                  <div className="jogo-card-meta">
                    <span className="status-badge confirmado">Confirmado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}