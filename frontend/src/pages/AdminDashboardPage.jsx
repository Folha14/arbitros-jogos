import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { utilizador } = useAuth();

  return (
    <div className="container">
      <h1>Painel de Administracao</h1>
      <p>Bem-vindo, {utilizador?.nome || 'admin'}.</p>

      <div className="dashboard-grid">
        <Link to="/admin/utilizadores" className="dashboard-card">
          <h2>Utilizadores</h2>
          <p>Ver contas, contactos e promover utilizadores a admin.</p>
        </Link>

        <Link to="/admin/escalao-valores" className="dashboard-card">
          <h2>Gestao de Valores</h2>
          <p>Editar os valores por equipa e escalao.</p>
        </Link>

        <Link to="/historico" className="dashboard-card">
          <h2>Historico</h2>
          <p>Consultar registos, filtrar e exportar CSV.</p>
        </Link>

        <Link to="/jogos" className="dashboard-card">
          <h2>Calendario</h2>
          <p>Ver jogos disponiveis para registar.</p>
        </Link>
      </div>
    </div>
  );
}