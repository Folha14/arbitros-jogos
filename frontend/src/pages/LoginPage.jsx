import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [emailTocado, setEmailTocado] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailInvalido = emailTocado && email !== '' && !/^\S+@\S+\.\S+$/.test(email);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setAEnviar(true);

    try {
      const res = await login(email, password);

      if (res?.requer2FA) {
        navigate('/validar-2fa', { state: { tempToken: res.tempToken, email: res.email } });
        return;
      }

      if (res?.utilizador?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao autenticar.');
    } finally {
      setAEnviar(false);
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
          <span className="auth-brand-tag">Plataforma oficial</span>
          <h2>
            Gere as tuas arbitragens
            <br />
            <span>num so lugar</span>
          </h2>
          <p>
            A plataforma do GRIB para os arbitros e mesa registarem jogos,
            consultarem o historico e acompanharem o calendario da equipa.
          </p>

          <div className="auth-highlights">
            <div className="auth-highlight-item">
              <div className="auth-highlight-icon">✓</div>
              <div className="auth-highlight-text">
                <strong>Registo rapido</strong>
                <span>Regista uma arbitragem em menos de um minuto.</span>
              </div>
            </div>

            <div className="auth-highlight-item">
              <div className="auth-highlight-icon">↻</div>
              <div className="auth-highlight-text">
                <strong>Calendario atualizado</strong>
                <span>Jogos sincronizados automaticamente com a FPB.</span>
              </div>
            </div>

            <div className="auth-highlight-item">
              <div className="auth-highlight-icon">€</div>
              <div className="auth-highlight-text">
                <strong>Valores automaticos</strong>
                <span>O valor de cada jogo e calculado por escalao e equipa.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="login-card">
          <h1>Entrar na conta</h1>
          <p className="auth-subtitle">Introduz os teus dados para continuar.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTocado(true)}
                className={emailInvalido ? 'input-erro' : ''}
                placeholder="nome@exemplo.com"
                required
              />
              {emailInvalido && (
                <span className="field-erro-inline">Introduza um email valido</span>
              )}
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>

            {erro && <p className="error-msg">{erro}</p>}

            <button type="submit" className="login-submit" disabled={aEnviar}>
              {aEnviar && <span className="spinner" />}
              {aEnviar ? 'A entrar...' : 'Entrar'}
            </button>

            <p className="login-help">
              Ainda nao tens conta? <Link to="/registar-conta">Criar conta</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}