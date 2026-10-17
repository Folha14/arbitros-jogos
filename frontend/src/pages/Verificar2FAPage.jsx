import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Verificar2FAPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const tempToken = location.state?.tempToken;
  const email = location.state?.email || 'email de registo';

  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [aReenviar, setAReenviar] = useState(false);

  if (!tempToken) {
    return (
      <div className="login-page">
        <div className="auth-form-panel" style={{ width: '100%' }}>
          <div className="login-card" style={{ textAlign: 'center' }}>
            <h1>Sessão Expirada</h1>
            <p className="auth-subtitle">Não existe nenhuma tentativa de login pendente.</p>
            <Link to="/login" className="login-submit" style={{ textDecoration: 'none', display: 'inline-block', width: '100%' }}>
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleValidar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!codigo || codigo.length < 6) {
      setErro('Introduz o código de 6 dígitos enviado para o teu email.');
      return;
    }

    setAEnviar(true);
    try {
      const { data } = await api.post('/auth/validar-2fa', {
        tempToken,
        codigo: codigo.trim(),
      });

      // Guardar sessão e navegar
      setAuthUser(data.token, data.utilizador);

      if (data.utilizador.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Código de segurança inválido.');
    } finally {
      setAEnviar(false);
    }
  }

  async function handleReenviar() {
    setErro('');
    setSucesso('');
    setAReenviar(true);

    try {
      const { data } = await api.post('/auth/reenviar-2fa', { tempToken });
      setSucesso(data.mensagem || 'Novo código enviado por email!');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao reenviar código.');
    } finally {
      setAReenviar(false);
    }
  }

  return (
    <div className="login-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <img src={logo} alt="GRIB" />
          <span>Arbitros Jogos</span>
        </div>
        <div className="auth-brand-middle">
          <span className="auth-brand-tag">Segurança de 2 Fatores</span>
          <h2>Autenticação 2FA</h2>
          <p>Para proteger a tua conta, enviámos um código de segurança de 6 dígitos para o email <strong>{email}</strong>.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="login-card">
          <h1>Verificação 2FA</h1>
          <p className="auth-subtitle">Introduz o código enviado para <strong>{email}</strong>.</p>

          <form onSubmit={handleValidar} className="login-form">
            <div className="login-field">
              <label>Código de Segurança (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--primary-green)',
                }}
                autoFocus
                required
              />
            </div>

            {erro && <p className="error-msg">{erro}</p>}
            {sucesso && <p className="success-msg">{sucesso}</p>}

            <button type="submit" className="login-submit" disabled={aEnviar}>
              {aEnviar && <span className="spinner" />}
              {aEnviar ? 'A verificar...' : 'Confirmar e Entrar'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <button
                type="button"
                onClick={handleReenviar}
                disabled={aReenviar}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-green)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {aReenviar ? 'A reenviar código...' : 'Reenviar código por email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
