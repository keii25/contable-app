
import Layout from './components/Layout';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cargarTransacciones } from './store/transactionsSlice';

export default function App(){
  const dispatch = useDispatch();
  useEffect(()=>{ (dispatch as any)(cargarTransacciones()); },[dispatch]);
  return (
    <Layout>
      <div className='container'>
        <Outlet />
      </div>
    </Layout>
  );
}
