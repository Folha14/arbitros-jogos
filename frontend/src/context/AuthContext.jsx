import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilizador, setUtilizador] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const utilizadorGuardado = localStorage.getItem('utilizador');

    try {
      if (token && utilizadorGuardado) {
        setUtilizador(JSON.parse(utilizadorGuardado));
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('utilizador');
      setUtilizador(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  async function register(dados) {
    const { data } = await api.post('/auth/register', dados);
    return data;
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.requer2FA) {
      return { requer2FA: true, tempToken: data.tempToken, email: data.email };
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('utilizador', JSON.stringify(data.utilizador));
    setUtilizador(data.utilizador);
    return { utilizador: data.utilizador };
  }

  function setAuthUser(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('utilizador', JSON.stringify(user));
    setUtilizador(user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('utilizador');
    setUtilizador(null);
  }

  return (
    <AuthContext.Provider value={{ utilizador, register, login, logout, setAuthUser, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}