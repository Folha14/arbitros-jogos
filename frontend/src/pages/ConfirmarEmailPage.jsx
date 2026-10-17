import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import api from '../services/api';

export default function ConfirmarEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('processando'); // 'processando' | 'sucesso' | 'erro'
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('erro');
      setMensagem('Link de confirmação inválido ou incompleto.');
      return;
    }

    async function ativarConta() {
      try {
        const { data } = await api.post('/auth/confirmar-email', { token });
        setEstado('sucesso');
        setMensagem(data.mensagem || 'Conta confirmada com sucesso!');
      } catch (err) {
        setEstado('erro');
        setMensagem(err.response?.data?.erro || 'Link de ativação inválido ou expirado.');
      }
    }

    ativarConta();
  }, [token]);

  return (
    <div className="login-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <img src={logo} alt="GRIB" />
          <span>Arbitros Jogos</span>
        </div>
        <div className="auth-brand-middle">
          <span className="auth-brand-tag">Ativação de Conta</span>
          <h2>Verificação de Email</h2>
          <p>Estamos a confirmar a tua conta para poderes aceder à plataforma com total segurança.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="login-card" style={{ textAlign: 'center' }}>
          {estado === 'processando' && (
            <div>
              <span className="spinner" style={{ width: '32px', height: '32px', borderColor: 'rgba(78,140,40,0.3)', borderTopColor: '#4e8c28', marginBottom: '1rem' }} />
              <h1>A verificar conta...</h1>
              <p className="auth-subtitle">Por favor aguarde um momento.</p>
            </div>
          )}

          {estado === 'sucesso' && (
            <div>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--primary-green)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--success-border)' }}>
                ✓
              </div>
              <h1>Conta Ativada!</h1>
              <p className="auth-subtitle">{mensagem}</p>
              <Link to="/login" className="login-submit" style={{ display: 'inline-block', textDecoration: 'none', width: '100%', marginTop: '1rem' }}>
                Iniciar Sessão
              </Link>
            </div>
          )}

          {estado === 'erro' && (
            <div>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--error-border)' }}>
                ✕
              </div>
              <h1>Falha na Ativação</h1>
              <p className="auth-subtitle" style={{ color: 'var(--error-text)' }}>{mensagem}</p>
              <Link to="/login" className="login-submit" style={{ display: 'inline-block', textDecoration: 'none', width: '100%', marginTop: '1rem' }}>
                Voltar ao Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
