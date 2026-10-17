import { useEffect, useState } from 'react';
import api from '../services/api';

export default function JogoSeletorPorData({ onSelecionar }) {
  const [data, setData] = useState('');
  const [jogos, setJogos] = useState([]);
  const [jogoId, setJogoId] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!data) {
      setJogos([]);
      setJogoId('');
      setErro('');
      onSelecionar(null);
      return;
    }

    async function buscarJogos() {
      setACarregar(true);
      setErro('');
      try {
        const { data: resultado } = await api.get('/jogos', {
          params: { data, casaGrib: 'true' },
        });
        setJogos(resultado);
        setJogoId('');
        onSelecionar(null);
      } catch (err) {
        console.error('Erro ao buscar jogos:', err);
        setErro('Nao foi possivel carregar os jogos.');
      } finally {
        setACarregar(false);
      }
    }

    buscarJogos();
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelecionar(e) {
    const id = e.target.value;
    setJogoId(id);

    if (!id) {
      onSelecionar(null);
      return;
    }

    const jogo = jogos.find((j) => String(j.id) === id);
    onSelecionar(jogo || null);
  }

  const jogoSelecionado = jogos.find((j) => String(j.id) === jogoId);

  return (
    <div className="jogo-seletor-por-data">
      <div className="field" style={{ marginBottom: '0.8rem' }}>
        <label style={{ display: 'block', marginBottom: '0.45rem' }}>Data *</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {aCarregar && <p className="autocomplete-loading">A carregar jogos...</p>}
      {erro && <p className="error-msg">{erro}</p>}

      {data && !aCarregar && !erro && jogos.length === 0 && (
        <p className="autocomplete-loading">Nenhum jogo do GRIB em casa nesta data.</p>
      )}

      {jogos.length > 0 && (
        <div className="field" style={{ marginBottom: '0.8rem' }}>
          <label style={{ display: 'block', marginBottom: '0.45rem' }}>Jogo dessa data *</label>
          <select value={jogoId} onChange={handleSelecionar} style={{ width: '100%' }}>
            <option value="">Selecione o jogo...</option>
            {jogos.map((jogo) => (
              <option key={jogo.id} value={jogo.id}>
                {jogo.equipaCasa} vs {jogo.equipaFora}
                {jogo.horaJogo ? ` - ${jogo.horaJogo}` : ''}
                {jogo.competicao ? ` (${jogo.competicao.escalao})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {jogoSelecionado && (
        <div className="jogo-selecionado-info">
          <strong>{jogoSelecionado.equipaCasa} vs {jogoSelecionado.equipaFora}</strong>
          <span>
            {jogoSelecionado.dataJogo}
            {jogoSelecionado.horaJogo ? ` - ${jogoSelecionado.horaJogo}` : ''}
          </span>
          {jogoSelecionado.pavilhao && <span>{jogoSelecionado.pavilhao}</span>}
        </div>
      )}
    </div>
  );
}