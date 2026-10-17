import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaAdmin({ children }) {
  const { utilizador, carregando } = useAuth();

  if (carregando) return <p>A carregar...</p>;

  if (!utilizador || utilizador.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}