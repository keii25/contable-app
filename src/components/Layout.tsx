
import { NavLink } from 'react-router-dom';
export default function Layout({ children }:{ children: React.ReactNode }){
  return (
    <div>
      <header style={{background:'#111827', color:'#fff'}}>
        <div className='container' style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
          <strong>Aplicación Contable</strong>
          <nav style={{display:'flex', gap:12}}>
            <NavLink to='/' style={{color:'#93c5fd'}}>Dashboard</NavLink>
            <NavLink to='/transacciones' style={{color:'#93c5fd'}}>Transacciones</NavLink>
            <NavLink to='/reportes' style={{color:'#93c5fd'}}>Reportes</NavLink>
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
