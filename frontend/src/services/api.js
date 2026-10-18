import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const urlPedido = (error.config?.url || '')
      .split('?')[0]
      .replace(/\/+$/, '');
    const pedidoDeAutenticacao = [
      '/auth/login',
      '/auth/validar-2fa',
      '/auth/reenviar-2fa',
    ].some((endpoint) => urlPedido.endsWith(endpoint));

    if (error.response?.status === 401 && !pedidoDeAutenticacao) {
      localStorage.removeItem('token');
      localStorage.removeItem('utilizador');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;