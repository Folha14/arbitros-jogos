import { useEffect, useState } from 'react';
import api from '../services/api';

export default function HistoricoTable() {
  const [registos, setRegistos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarRegistos();
  }, []);

  async function carregarRegistos() {
    setACarregar(true);
    try {
      const { data } = await api.get('/registos');
      setRegistos(data.resultados);
    } catch (err) {
      setErro('Erro ao carregar o historico.');
    } finally {
      setACarregar(false);
    }
  }

  async function exportarCSV() {
    try {
      const { data } = await api.get('/registos/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historico_registos.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErro('Erro ao exportar CSV.');
    }
  }

  if (aCarregar) return <p>A carregar historico...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Historico de Registos</h2>
        <button onClick={exportarCSV} style={{ padding: '8px 16px' }}>
          Exportar CSV
        </button>
      </div>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Data</th>
            <th style={{ padding: '8px' }}>Jogo</th>
            <th style={{ padding: '8px' }}>Funcao</th>
            <th style={{ padding: '8px' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {registos.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>
                Sem registos ainda.
              </td>
            </tr>
          ) : (
            registos.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{r.dataJogo}</td>
                <td style={{ padding: '8px' }}>
                  {r.equipaCasa} vs {r.equipaFora}
                </td>
                <td style={{ padding: '8px' }}>{r.funcao}</td>
                <td style={{ padding: '8px' }}>{r.valor ? `${r.valor} €` : '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}