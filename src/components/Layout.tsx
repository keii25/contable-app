
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps){
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header className="app-header">
        <div className="container header-container">
          <div className="brand">Aplicación Contable</div>

          <button
            className="hamburger"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <nav className={`header-nav ${open ? 'open' : ''}`}>
            <div className="nav-links">
              <NavLink to='/' className="nav-link" onClick={()=>setOpen(false)}>Dashboard</NavLink>
              <NavLink to='/transacciones' className="nav-link" onClick={()=>setOpen(false)}>Transacciones</NavLink>
              <NavLink to='/reportes' className="nav-link" onClick={()=>setOpen(false)}>Reportes</NavLink>
              {user?.role === 'admin' && <NavLink to='/admin-usuarios' className="nav-link" onClick={()=>setOpen(false)}>Admin Usuarios</NavLink>}
            </div>
            <div className="nav-actions">
              <div className="user-info">{user ? `Usuario: ${user.username} (${user.role})` : ''}</div>
              <button onClick={() => { logout(); setOpen(false); }} className="logout-btn">Salir</button>
            </div>
          </nav>
        </div>
      </header>

      <main style={{marginTop: '16px'}}>
        {children}
      </main>
    </div>
  );
}
