
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps){
  const { user, logout } = useAuth();

  return (
    <div>
      <header style={{background:'#111827', color:'#fff'}}>
        <div className='container' style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
          <strong>Aplicación Contable</strong>
          <nav style={{display:'flex', gap:12, alignItems:'center'}}>
            <NavLink to='/' style={{color:'#93c5fd'}}>Dashboard</NavLink>
            <NavLink to='/transacciones' style={{color:'#93c5fd'}}>Transacciones</NavLink>
            <NavLink to='/reportes' style={{color:'#93c5fd'}}>Reportes</NavLink>
            {user?.role === 'admin' && <NavLink to='/admin-usuarios' style={{color:'#93c5fd'}}>Admin Usuarios</NavLink>}
            <span>Usuario: {user?.username} ({user?.role})</span>
            <button onClick={logout} style={{color:'#fff', background:'red', border:'none', padding:'4px 8px'}}>Logout</button>
          </nav>
        </div>
      </header>
      {/* Espacio debajo del menú */}
      <main style={{marginTop: '16px'}}>
        {children}
      </main>
    </div>
  );
}
