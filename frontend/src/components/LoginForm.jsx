import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setAEnviar(true);

    try {
      const utilizador = await login(email.trim().toLowerCase(), password);

      if (utilizador.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao autenticar. Verifique os dados.');
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="jose@grib.pt"
        />
      </div>

      <div className="login-field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {erro && <p className="error-msg">{erro}</p>}

      <button type="submit" disabled={aEnviar} className="login-submit">
        {aEnviar ? 'A entrar...' : 'Entrar'}
      </button>

      <p className="login-help">
        Ainda nao tens conta? <Link to="/registar-conta">Criar conta</Link>
      </p>
    </form>
  );
}