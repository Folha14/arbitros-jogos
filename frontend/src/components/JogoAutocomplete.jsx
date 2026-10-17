import { useEffect, useState } from 'react';
import api from '../services/api';

export default function JogoAutocomplete({ onSelecionar }) {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [aPesquisar, setAPesquisar] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);

  useEffect(() => {
    if (termo.trim().length < 2) {
      setResultados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setAPesquisar(true);
      try {
        const { data } = await api.get('/jogos', { params: { pesquisa: termo } });
        setResultados(data);
        setMostrarLista(true);
      } catch (err) {
        console.error('Erro ao pesquisar jogos:', err);
      } finally {
        setAPesquisar(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [termo]);

  function selecionarJogo(jogo) {
    setTermo(`${jogo.equipaCasa} vs ${jogo.equipaFora} - ${jogo.dataJogo}`);
    setMostrarLista(false);
    onSelecionar(jogo);
  }

  return (
    <div className="autocomplete-wrapper">
      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => resultados.length > 0 && setMostrarLista(true)}
        placeholder="Pesquisar equipa..."
        autoComplete="off"
      />

      {aPesquisar && <p className="autocomplete-loading">A pesquisar...</p>}

      {mostrarLista && resultados.length > 0 && (
        <ul className="autocomplete-list">
          {resultados.map((jogo) => (
            <li key={jogo.id} onClick={() => selecionarJogo(jogo)}>
              {jogo.equipaCasa} vs {jogo.equipaFora} - {jogo.dataJogo}
              {jogo.competicao && ` (${jogo.competicao.escalao})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}