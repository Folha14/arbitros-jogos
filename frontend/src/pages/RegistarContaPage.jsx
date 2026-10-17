import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import RegistarContaForm from '../components/RegistarContaForm';

export default function RegistarContaPage() {
  return (
    <div className="register-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <img src={logo} alt="GRIB" />
          <span>Arbitros Jogos</span>
        </div>

        <div className="auth-brand-middle">
          <span className="auth-brand-tag">Criar Nova Conta</span>
          <h2>
            Junta-te a equipa
            <br />
            <span>de arbitragem</span>
          </h2>
          <p>
            Cria a tua conta oficial para apontar os teus jogos de arbitro ou mesa, acompanhar os teus rendimentos e gerir as tuas convocatorias.
          </p>

          <div className="auth-highlights">
            <div className="auth-highlight-item">
              <div className="auth-highlight-icon">✓</div>
              <div className="auth-highlight-text">
                <strong>Registo simples</strong>
                <span>Cria a tua conta em menos de 1 minuto.</span>
              </div>
            </div>

            <div className="auth-highlight-item">
              <div className="auth-highlight-icon">★</div>
              <div className="auth-highlight-text">
                <strong>Funcao automatizada</strong>
                <span>Funcao de arbitro ou mesa associada ao teu perfil.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="register-card">
          <h1>Criar conta</h1>
          <p className="auth-subtitle">Preenche os teus dados para te registares.</p>
          <RegistarContaForm />
          <p className="login-help" style={{ marginTop: '1.2rem' }}>
            Já tens conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}