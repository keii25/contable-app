
import Layout from './components/Layout';
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cargarTransacciones } from './store/transactionsSlice';
import Login from './components/Login';

export default function App(){
  const dispatch = useDispatch();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('loggedIn');
    const savedRole = localStorage.getItem('role');
    if (saved === 'true' && savedRole) {
      setLoggedIn(true);
      setRole(savedRole as 'admin' | 'user');
    }
  }, []);

  useEffect(()=>{ if (loggedIn) (dispatch as any)(cargarTransacciones(role === 'admin' ? 'iecp_transacciones_admin' : 'iecp_transacciones_user1')); },[dispatch, loggedIn, role]);

  const handleLogin = (userRole: 'admin' | 'user') => {
    setLoggedIn(true);
    setRole(userRole);
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('role', userRole);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setRole(null);
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('role');
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout onLogout={handleLogout} role={role}>
      <div className='container'>
        <Outlet />
      </div>
    </Layout>
  );
}
