import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { utilizador, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = utilizador?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logotipo do clube" />
        <span>Arbitros Jogos</span>
      </div>

      <div className="navbar-links">
        <NavLink 
          to={isAdmin ? '/admin' : '/dashboard'} 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Início
        </NavLink>
        
        {!isAdmin && (
          <NavLink 
            to="/registar" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Registar
          </NavLink>
        )}
        
        <NavLink 
          to="/historico" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Histórico
        </NavLink>
        
        <NavLink 
          to="/jogos" 
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Calendário
        </NavLink>
        
        {isAdmin && (
          <NavLink
            to="/admin/jogos"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Jogos
          </NavLink>
        )}

        {isAdmin && (
          <NavLink 
            to="/admin/escalao-valores" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Valores
          </NavLink>
        )}
        
        {isAdmin && (
          <NavLink 
            to="/admin/utilizadores" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Utilizadores
          </NavLink>
        )}
      </div>

      <div className="navbar-right">
        {utilizador && (
          <>
            <span className={`role-badge ${isAdmin ? 'admin' : ''}`}>
              {isAdmin ? 'Admin' : 'Árbitro'}
            </span>
            <button className="navbar-logout" onClick={handleLogout}>
              Sair
            </button>
          </>
        )}
      </div>
    </nav>
  );
}