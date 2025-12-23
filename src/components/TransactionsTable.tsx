
import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useState, useEffect } from 'react';
import { eliminarTransaccion, cargarTransacciones } from '../store/transactionsSlice';
import { selectTransacciones, selectCuentas, selectTransactionsStatus } from '../store/selectors';
import TransactionForm from './TransactionForm';
import ConfirmDialog from './ConfirmDialog';
import SuccessDialog from './SuccessDialog';
import { useAuth } from '../context/AuthContext';
import type { FiltroTransacciones, Transaccion } from '../types';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthNameFromDate = (fecha:string) => MESES[Number(fecha.slice(5,7)) - 1];

function mostrarCuenta(t: Transaccion){
  if (t.tipoMovimiento !== 'CREDITO') return t.cuentaContable;
  switch (t.cuentaContable) {
    case '4105 - Ingresos Operacionales': return 'Diezmos';
    case '4110 - Otras Ventas/Ingresos':  return 'Ofrendas';
    case '4130 - Ofrendas Ministeriales': return 'Ofrendas Ministeriales';
    case '4199 - Otros Ingresos':         return 'Otros';
    default: return t.cuentaContable;
  }
}

export default function TransactionsTable(){
  const dispatch = useDispatch();
  const { user } = useAuth();
  const items    = useSelector(selectTransacciones);
  const cuentas  = useSelector(selectCuentas);
  const status   = useSelector(selectTransactionsStatus);

  console.log('📊 TransactionsTable render - user:', user, 'items:', items, 'status:', status);

  // Cargar transacciones cuando el componente se monte o cambie el usuario
  useEffect(() => {
    console.log('🔄 TransactionsTable useEffect - user:', user);
    if (user?.id) {
      console.log('📥 Dispatching cargarTransacciones with userId:', user.id);
      dispatch(cargarTransacciones(user.id));
    } else {
      console.log('⚠️ No user or user.id available');
    }
  }, [dispatch, user?.id]);

  const [filtros, setFiltros] = useState<FiltroTransacciones & { mesNombre?: string }>({});
  const [searchText, setSearchText] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaccion|null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string|null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [draftEditing, setDraftEditing] = useState<Transaccion|null>(null);
  const solicitarEdicion = (t: Transaccion) => { setDraftEditing(t); setEditConfirmOpen(true); };

  const filtered = useMemo(()=>{
    console.log('🔍 Filtering transactions - items:', items, 'filtros:', filtros);
    let d = [...(items || [])];
    if (filtros.fechaDesde)       d = d.filter(t => t.fecha >= filtros.fechaDesde!);
    if (filtros.fechaHasta)       d = d.filter(t => t.fecha <= filtros.fechaHasta!);
    if (filtros.cuentaContable)   d = d.filter(t => t.cuentaContable === filtros.cuentaContable);
    if (filtros.mesNombre)        d = d.filter(t => monthNameFromDate(t.fecha) === filtros.mesNombre);
    if (filtros.cedula)           d = d.filter(t => t.cedula && t.cedula.includes(filtros.cedula!));
    if (filtros.nombresApellidos) d = d.filter(t => ((t.nombresApellidos || '').toLowerCase()).includes((filtros.nombresApellidos || '').toLowerCase()));
    console.log('✅ Filtered result:', d);
    return d.sort((a,b)=> a.fecha.localeCompare(b.fecha));
  }, [items, filtros]);

  console.log('📊 TransactionsTable render - user:', user, 'items:', items, 'filtered:', filtered);

  const ingresos = filtered.filter(t => t.tipoMovimiento === 'CREDITO');
  const egresos  = filtered.filter(t => t.tipoMovimiento === 'DEBITO');

  const confirmDelete = (id:string) => { setToDelete(id); setConfirmOpen(true); };

  const IngresosTable = ({data}:{data:Transaccion[]}) => (
    <div className="card" style={{marginTop:10}}>
      <div className="hdr">Ingresos</div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Descripción</th><th>Cuenta</th>
              <th>Cedula</th><th>Nombres y Apellidos</th>
              <th style={{textAlign:'right'}}>Valor</th><th style={{textAlign:'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(t => (
              <tr key={t.id}>
                <td>{t.fecha}</td>
                <td>{t.descripcion}</td>
                <td>{mostrarCuenta(t)}</td>
                <td>{t.cedula}</td>
                <td>{t.nombresApellidos}</td>
                <td style={{textAlign:'right'}}>${t.valor.toLocaleString()}</td>
                <td style={{textAlign:'right'}}>
                  <button className="btn btn-primary" title="Editar" onClick={()=>solicitarEdicion(t)}>Editar</button>{' '}
                  <button className="btn btn-danger" title="Eliminar" onClick={()=>confirmDelete(t.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EgresosTable = ({data}:{data:Transaccion[]}) => (
    <div className="card" style={{marginTop:10}}>
      <div className="hdr">Egresos</div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Descripción</th><th>Cuenta</th>
              <th style={{textAlign:'right'}}>Valor</th><th style={{textAlign:'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(t => (
              <tr key={t.id}>
                <td>{t.fecha}</td>
                <td>{t.descripcion}</td>
                <td>{t.cuentaContable}</td>
                <td style={{textAlign:'right'}}>${t.valor.toLocaleString()}</td>
                <td style={{textAlign:'right'}}>
                  <button className="btn btn-primary" title="Editar" onClick={()=>solicitarEdicion(t)}>Editar</button>{' '}
                  <button className="btn btn-danger" title="Eliminar" onClick={()=>confirmDelete(t.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Mostrar loading mientras se cargan las transacciones
  if (status === 'loading') {
    return (
      <div className="container">
        <div className="card">
          <h2 className="hdr">Transacciones</h2>
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <p>Cargando transacciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex" style={{justifyContent:'space-between'}}>
        <h2 className="hdr">Transacciones</h2>
        <button className="btn btn-primary" onClick={()=>{ setEditing(null); setModalOpen(true); }}>Añadir</button>
      </div>
      <br></br>
      <div className="card grid grid-2">
        <input type="date" className="input" placeholder="Desde"
          value={filtros.fechaDesde || ''}
          onChange={e=> setFiltros({ ...filtros, fechaDesde: e.target.value || undefined })}
        />
        <input type="date" className="input" placeholder="Hasta"
          value={filtros.fechaHasta || ''}
          onChange={e=> setFiltros({ ...filtros, fechaHasta: e.target.value || undefined })}
        />
        <select className="select"
          value={filtros.cuentaContable || ''}
          onChange={e=> setFiltros({ ...filtros, cuentaContable: e.target.value || undefined })}
        >
          <option value="">Cuenta</option>
          {cuentas.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select"
          value={filtros.mesNombre || ''}
          onChange={e=> setFiltros({ ...filtros, mesNombre: e.target.value || undefined })}
        >
          <option value="">Mes</option>
          {MESES.map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{display:'flex', gap:8}}>
          <input className="input" placeholder="Buscar: Cedula o Nombres y Apellidos"
            value={searchText}
            onChange={e=> setSearchText(e.target.value)}
          />
          <button className="btn" onClick={()=>{
            const t = (searchText||'').trim();
            if(!t){ setFiltros({ ...filtros, cedula: undefined, nombresApellidos: undefined }); return; }
            if(/^\d+$/.test(t)) setFiltros({ ...filtros, cedula: t, nombresApellidos: undefined });
            else setFiltros({ ...filtros, nombresApellidos: t, cedula: undefined });
          }}>Buscar</button>
        </div>
        <button className="btn" onClick={()=>{ setFiltros({}); setSearchText(''); }}>Limpiar</button>
      </div>

      <IngresosTable data={ingresos} />
      <EgresosTable data={egresos} />

      <TransactionForm
        open={modalOpen}
        onClose={()=> setModalOpen(false)}
        editing={editing}
        onSaved={()=> setSuccessOpen(true)}
      />

      {/* Confirmación de eliminar (defaults: Eliminar, rojo) */}
      <ConfirmDialog
        open={confirmOpen}
        onCancel={()=>{ setConfirmOpen(false); setToDelete(null); }}
        onConfirm={()=>{
          if(toDelete){ dispatch(eliminarTransaccion(toDelete)); }
          setConfirmOpen(false);
          setToDelete(null);
        }}
      />

      {/* Confirmación de edición (Editar, azul) */}
      <ConfirmDialog
        open={editConfirmOpen}
        title="Confirmar edición"
        message="¿Seguro que deseas editar este registro?"
        confirmLabel="Editar"
        confirmClass="btn btn-primary"
        onCancel={()=>{ setEditConfirmOpen(false); setDraftEditing(null); }}
        onConfirm={()=>{
          if (draftEditing) {
            setEditing(draftEditing);
            setModalOpen(true);
          }
          setEditConfirmOpen(false);
        }}
      />

      <SuccessDialog
        open={successOpen}
        onClose={()=> setSuccessOpen(false)}
        message="Registrado exitosamente"
      />
    </div>
  );
}
