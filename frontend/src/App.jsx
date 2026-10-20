import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RotaAdmin from './components/RotaAdmin';
import RotaNaoAdmin from './components/RotaNaoAdmin';
import { useAuth } from './context/AuthContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEscalaoValoresPage from './pages/AdminEscalaoValoresPage';
import AdminJogosPage from './pages/AdminJogosPage';
import AdminUtilizadoresPage from './pages/AdminUtilizadoresPage';
import DashboardPage from './pages/DashboardPage';
import HistoricoPage from './pages/HistoricoPage';
import JogosCalendarioPage from './pages/JogosCalendarioPage';
import LoginPage from './pages/LoginPage';
import RegistarContaPage from './pages/RegistarContaPage';
import RegistoPage from './pages/RegistoPage';

import ConfirmarEmailPage from './pages/ConfirmarEmailPage';
import Verificar2FAPage from './pages/Verificar2FAPage';

function RotaPrivada({ children }) {
  const { utilizador, carregando } = useAuth();

  if (carregando) return <p>A carregar...</p>;
  if (!utilizador) return <Navigate to="/login" replace />;

  return children;
}

function PaginaInicialPorPerfil() {
  const { utilizador, carregando } = useAuth();

  if (carregando) return <p>A carregar...</p>;
  if (!utilizador) return <Navigate to="/login" replace />;

  if (utilizador.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { utilizador } = useAuth();

  return (
    <>
      {utilizador && <Navbar />}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registar-conta" element={<RegistarContaPage />} />
        <Route path="/confirmar-email" element={<ConfirmarEmailPage />} />
        <Route path="/validar-2fa" element={<Verificar2FAPage />} />

        <Route
          path="/"
          element={
            <RotaPrivada>
              <PaginaInicialPorPerfil />
            </RotaPrivada>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RotaPrivada>
              <DashboardPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/admin"
          element={
            <RotaAdmin>
              <AdminDashboardPage />
            </RotaAdmin>
          }
        />

        <Route
          path="/registar"
          element={
            <RotaNaoAdmin>
              <RegistoPage />
            </RotaNaoAdmin>
          }
        />

        <Route
          path="/historico"
          element={
            <RotaPrivada>
              <HistoricoPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/admin/escalao-valores"
          element={
            <RotaAdmin>
              <AdminEscalaoValoresPage />
            </RotaAdmin>
          }
        />

        <Route
          path="/admin/jogos"
          element={
            <RotaAdmin>
              <AdminJogosPage />
            </RotaAdmin>
          }
        />

        <Route
          path="/jogos"
          element={
            <RotaPrivada>
              <JogosCalendarioPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/admin/utilizadores"
          element={
            <RotaAdmin>
              <AdminUtilizadoresPage />
            </RotaAdmin>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}