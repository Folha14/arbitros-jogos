import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import JogoSeletorPorData from './JogoSeletorPorData';

function mapearFuncaoPadrao(funcaoPadrao) {
  if (funcaoPadrao === 'mesa') return 'mesa';
  return 'arbitro1';
}

export default function RegistoForm() {
  const { utilizador } = useAuth();

  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  const [funcao, setFuncao] = useState(mapearFuncaoPadrao(utilizador?.funcaoPadrao));
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [valoresEscalao, setValoresEscalao] = useState([]);
  const [valorTocado, setValorTocado] = useState(false);
  const [jogoTocado, setJogoTocado] = useState(false);

  useEffect(() => {
    async function carregarValores() {
      try {
        const { data } = await api.get('/escalao-valores');
        setValoresEscalao(data);
      } catch (err) {
        console.error('Erro ao carregar valores:', err);
      }
    }

    carregarValores();
  }, []);

  useEffect(() => {
    if (!jogoSelecionado?.equipaCasa || !jogoSelecionado?.competicao?.escalao) {
      setValor('');
      return;
    }

    const normalizar = (texto) =>
      String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/masculinos|masculino|masc/g, 'masc')
        .replace(/femininos|feminino|fem/g, 'fem')
        .replace(/\s+/g, '')
        .replace(/-/g, '')
        .replace(/_/g, '')
        .replace(/[^\p{L}\p{N}|]/gu, '');

    const normalizarEquipa = (texto) => {
      const nome = normalizar(texto);

      if (
        nome.includes('brandoense') ||
        nome.includes('grib') ||
        nome.includes('duvalli')
      ) {
        return 'brandoense';
      }

      return nome;
    };

    const obterLetraEquipa = (equipaCasa) => {
      const match = equipaCasa.match(/\b([A-C])\b/i);
      return match ? match[1].toLowerCase() : '';
    };

    const equipaJogo = normalizarEquipa(jogoSelecionado.equipaCasa);
    const letraJogo = obterLetraEquipa(jogoSelecionado.equipaCasa);
    const escalaoBase = normalizar(jogoSelecionado.competicao.escalao);
    const escalaoJogo = escalaoBase + letraJogo;

    const registoExato = valoresEscalao.find((item) => {
      const equipaItem = normalizarEquipa(item.equipa);
      const escalaoItem = normalizar(item.escalao);
      return equipaItem === equipaJogo && escalaoItem === escalaoJogo;
    });

    const registoParcial = valoresEscalao.find((item) => {
      const equipaItem = normalizarEquipa(item.equipa);
      const escalaoItem = normalizar(item.escalao);
      return (
        equipaItem === equipaJogo &&
        escalaoItem &&
        (escalaoJogo.startsWith(escalaoItem) || escalaoItem.startsWith(escalaoJogo))
      );
    });

    const registoValor = registoExato || registoParcial;

    if (!registoValor) {
      setValor('');
      return;
    }

    const novoValor =
      funcao === 'mesa'
        ? registoValor.valor_mesa
        : registoValor.valor_arbitro;

    setValor(novoValor != null ? String(novoValor) : '');
  }, [jogoSelecionado, funcao, valoresEscalao]);

  const valorInvalido = valorTocado && jogoSelecionado && (valor === '' || isNaN(parseFloat(valor)));
  const jogoInvalido = jogoTocado && !jogoSelecionado;
  const valorValido = jogoSelecionado && valor !== '' && !isNaN(parseFloat(valor));

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setJogoTocado(true);
    setValorTocado(true);

    if (!jogoSelecionado) {
      setErro('Selecione um jogo antes de registar.');
      return;
    }

    if (valor === '' || valor == null || isNaN(parseFloat(valor))) {
      setErro('Não foi encontrado um valor automático para esta equipa e escalão.');
      return;
    }

    setAEnviar(true);
    try {
      await api.post('/registos', {
        jogo_id: jogoSelecionado.id,
        funcao,
        valor: parseFloat(valor),
        observacoes: observacoes.trim() || null,
      });

      setSucesso('Registo de arbitragem criado com sucesso!');
      setJogoSelecionado(null);
      setValor('');
      setObservacoes('');
      setFuncao(mapearFuncaoPadrao(utilizador?.funcaoPadrao));
      setJogoTocado(false);
      setValorTocado(false);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar registo.');
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="form-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.25rem', fontSize: '1.4rem' }}>Apontar Jogo</h1>
      <form onSubmit={handleSubmit} noValidate>
        
        <div className="field">
          <JogoSeletorPorData
            onSelecionar={(jogo) => {
              setJogoSelecionado(jogo);
              setJogoTocado(true);
            }}
          />
          {jogoInvalido && (
            <span className="field-erro-inline">Selecione um jogo para continuar</span>
          )}
        </div>

        <div className="field">
          <label style={{ display: 'block', marginBottom: '0.45rem' }}>Função</label>
          <select value={funcao} onChange={(e) => setFuncao(e.target.value)} style={{ width: '100%' }}>
            <option value="arbitro1">Árbitro</option>
            <option value="mesa">Mesa</option>
          </select>
        </div>

        <div className="field field-relative">
          <label style={{ display: 'block', marginBottom: '0.45rem' }}>Valor de Compensação</label>
          <div className={`currency-input ${valorInvalido ? 'input-erro' : ''} ${valorValido ? 'input-sucesso' : ''}`} style={{ maxWidth: '100%' }}>
            <span>€</span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onBlur={() => setValorTocado(true)}
              readOnly={utilizador?.role !== 'admin'}
              onChange={utilizador?.role === 'admin' ? (e) => setValor(e.target.value.replace(',', '.')) : undefined}
              placeholder="0.00"
            />
          </div>
          {valorValido && <span className="field-check-inline" style={{ top: '2.5rem' }}>✓</span>}
          {valorInvalido && (
            <span className="field-erro-inline">Nenhum valor automático encontrado para esta equipa/escalão</span>
          )}
          {!jogoSelecionado && (
            <span className="field-hint">Selecione um jogo para calcular o valor automaticamente</span>
          )}
        </div>

        <div className="field">
          <label style={{ display: 'block', marginBottom: '0.45rem' }}>Observações (opcional)</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
            placeholder="Notas adicionais sobre o jogo, pavilhões ou ocorrências..."
          />
        </div>

        {erro && <p className="error-msg">{erro}</p>}
        {sucesso && <p className="success-msg">{sucesso}</p>}

        <button type="submit" className="btn-submit" disabled={aEnviar} style={{ width: '100%', marginTop: '0.5rem' }}>
          {aEnviar && <span className="spinner" />}
          {aEnviar ? 'A processar...' : 'Confirmar Registo'}
        </button>
      </form>
    </div>
  );
}