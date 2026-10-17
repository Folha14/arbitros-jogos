import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegistarContaForm() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.replace(/\D/g, '').slice(0, 9);
    const emailLimpo = email.trim().toLowerCase();

    if (!nomeLimpo || !telefoneLimpo || !emailLimpo || !password) {
      setErro('Nome, contacto telefonico, email e password sao obrigatorios.');
      return;
    }

    if (!/^\d{9}$/.test(telefoneLimpo)) {
      setErro('O contacto telefonico deve ter exatamente 9 digitos.');
      return;
    }

    setAEnviar(true);

    try {
      await register({
        nome: nomeLimpo,
        telefone: telefoneLimpo,
        email: emailLimpo,
        password,
      });

      setSucesso('Conta criada com sucesso! Pode agora entrar.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.log(err.response?.data);
      setErro(
        err.response?.data?.detalhe
          ? `${err.response?.data?.erro}: ${err.response?.data?.detalhe}`
          : err.response?.data?.erro || 'Erro ao criar conta.'
      );
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label>Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          placeholder="Jose Folha"
        />
      </div>

      <div className="login-field">
        <label>Contacto telefonico</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          maxLength={9}
          pattern="[0-9]{9}"
          required
          placeholder="912345678"
        />
      </div>

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
      {sucesso && <p className="success-msg">{sucesso}</p>}

      <button type="submit" disabled={aEnviar} className="login-submit">
        {aEnviar ? 'A criar conta...' : 'Criar conta'}
      </button>
    </form>
  );
}