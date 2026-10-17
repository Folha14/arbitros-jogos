import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaNaoAdmin({ children }) {
  const { utilizador, carregando } = useAuth();

  if (carregando) return <p>A carregar...</p>;
  if (!utilizador) return <Navigate to="/login" replace />;
  if (utilizador.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}