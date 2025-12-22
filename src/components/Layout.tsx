
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  role: 'admin' | 'user' | null;
}

export default function Layout({ children, onLogout, role }: LayoutProps){
  return (
    <div>
      <header style={{background:'#111827', color:'#fff'}}>
        <div className='container' style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
          <strong>Aplicación Contable</strong>
          <nav style={{display:'flex', gap:12, alignItems:'center'}}>
            <NavLink to='/' style={{color:'#93c5fd'}}>Dashboard</NavLink>
            <NavLink to='/transacciones' style={{color:'#93c5fd'}}>Transacciones</NavLink>
            <NavLink to='/reportes' style={{color:'#93c5fd'}}>Reportes</NavLink>
            <span>Usuario: {role}</span>
            <button onClick={onLogout} style={{color:'#fff', background:'red', border:'none', padding:'4px 8px'}}>Logout</button>
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
