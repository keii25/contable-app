
import { useDispatch, useSelector } from 'react-redux';
import { agregarTransaccion, actualizarTransaccion } from '../store/transactionsSlice';
import type { Transaccion } from '../types';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const opcionesIngresosUI = [
  { label: 'Seleccione', value: '' },
  { label: 'Diezmos', value: 'Diezmos' },
  { label: 'Ofrendas', value: 'Ofrendas' },
  { label: 'Ofrendas Ministeriales', value: 'Ofrendas Ministeriales' },
  { label: 'Otros', value: 'Otros' }
];

const cuentasEgresos = [
  '',
  '5105 - Gastos de Aseo','5110 - Ayuda Social','5120 - Construcción y Mantenimiento','5145 - Diezmo de Diezmos',
  '5130 - Aportes Fondo Nacional','5140 - Subsidio de Transporte','5150 - Impuesto Predial','5160 - Intereses de Cesantías',
  '5170 - Mantenimiento','5180 - Misiones y Evangelismo','5185 - Ofrenda Ministerios','5190 - Otros Gastos',
  '5200 - Emolumento Pastora','5210 - Servicios Públicos','5220 - Sonido y Multimedia','5230 - Emolumento Pastor',
  '5240 - Tecnología','5250 - Útiles y Papelería','5260 - Vacaciones'
];

type Props = { open: boolean; onClose: () => void; editing?: Transaccion | null; onSaved: () => void; };

type FormData = {
  fecha:string; tipoMovimiento:'DEBITO'|'CREDITO'; cedula?:string; nombresApellidos?:string;
  cuentaContable:string; valor:number; descripcion:string;
};

export default function TransactionForm({ open, onClose, editing = null, onSaved }: Props){
  const dispatch = useDispatch();  const { user } = useAuth();  const nombresPorCedula = useSelector((state: any) => state.transactions.nombresPorCedula);

  // "hoy" calculado en formato YYYY-MM-DD para atributos HTML y validación
  const hoy = useMemo(()=> new Date().toISOString().slice(0,10), []);

  const [form, setForm] = useState<FormData>({
    fecha: '', tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:''
  });
  const [valorStr, setValorStr] = useState('');

  const cedulaRef = useRef<HTMLInputElement>(null);
  const cuentaRef = useRef<HTMLSelectElement>(null);

  useEffect(()=>{
    if(open){
      if(editing){
        const f = editing as Transaccion;
        setForm({
          fecha: f.fecha, tipoMovimiento: f.tipoMovimiento, cedula: f.cedula,
          nombresApellidos: f.nombresApellidos, cuentaContable: f.cuentaContable,
          valor: f.valor, descripcion: f.descripcion || ''
        });
        setValorStr((f.valor||0).toLocaleString('es-CO'));
      } else {
        // Modo Añadir → formulario completamente limpio
        setForm({ fecha: hoy, tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:'' });
        setValorStr('');
      }
    }
  }, [open, editing]);

  useEffect(() => {
    if (open && !editing) {
      // Al abrir en modo añadir, foco en el primer campo
      setTimeout(() => {
        if (form.tipoMovimiento === 'CREDITO') {
          cedulaRef.current?.focus();
        } else {
          cuentaRef.current?.focus();
        }
      }, 100);
    }
  }, [open, editing, form.tipoMovimiento]);

  const onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault();
    // Validaciones esenciales (sin fecha futura)
    if(!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) return alert('Fecha inválida (formato YYYY-MM-DD)');
    if(form.fecha > hoy) return alert('No se permite seleccionar una fecha futura');
    if(form.valor<=0) return alert('Valor debe ser > 0');

    const ced = (form.cedula||'').replace(/[^0-9]/g,'');
    const payloadBase: Omit<Transaccion,'id'> = {
      fecha: form.fecha,
      tipoMovimiento: form.tipoMovimiento,
      cuentaContable: form.cuentaContable,
      valor: form.valor,
      descripcion: (form.descripcion || ''),
      centroCosto: 'Sede Corozal',
      cedula: form.tipoMovimiento==='CREDITO' ? (ced || '1010') : undefined,
      nombresApellidos: form.tipoMovimiento==='CREDITO' ? (form.nombresApellidos||'') : undefined
    } as any;

    try {
      if(editing){
        (dispatch as any)(actualizarTransaccion({ id: editing.id, updates: payloadBase }));
        onClose(); onSaved();
      } else {
        if (user?.id) {
          console.log('💾 TransactionForm - Adding transaction for user:', user, 'userId:', user.id);
          (dispatch as any)(agregarTransaccion({ transaction: payloadBase, userId: user.id }));
          // Si estamos agregando y es un Ingreso (CREDITO), mantener el diálogo abierto
          // y limpiar solo los campos: cedula, nombresApellidos, descripcion y valor.
          if (payloadBase.tipoMovimiento === 'CREDITO'){
            setForm({
              // conservar fecha y cuentaContable
              fecha: form.fecha,
              tipoMovimiento: 'CREDITO',
              cedula: '',
              nombresApellidos: '',
              cuentaContable: form.cuentaContable,
              valor: 0,
              descripcion: ''
            });
            setValorStr('');
            onSaved();
            cedulaRef.current?.focus();
          } else if (payloadBase.tipoMovimiento === 'DEBITO'){
            // Para Egresos, mantener abierto y limpiar cuentaContable, valor, descripcion; conservar fecha
            setForm({
              fecha: form.fecha,
              tipoMovimiento: 'DEBITO',
              cuentaContable: '',
              valor: 0,
              descripcion: ''
            });
            setValorStr('');
            onSaved();
            cuentaRef.current?.focus();
          } else {
            // Para otros tipos, cerrar como antes
            onClose(); onSaved();
          }
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error al guardar la transacción');
    }
  };

  if(!open) return null;

  const handleValorChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const digits = e.target.value.replace(/[^0-9]/g,'');
    const num = Number(digits||'0');
    setValorStr(num? num.toLocaleString('es-CO') : '');
    setForm({ ...form, valor: num });
  };

  const handleCedulaChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const digits = e.target.value.replace(/[^0-9]/g,'');
    const nombre = nombresPorCedula[digits] || '';
    setForm({ ...form, cedula: digits, nombresApellidos: nombre });
  };

  const isCredito = form.tipoMovimiento==='CREDITO';

  // Cambiar tipo (Ingresos ↔ Egresos) y LIMPIAR todo excepto fecha
  const switchToCredito = ()=>{
    setForm({ fecha: form.fecha, tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:'' });
    setValorStr('');
  };
  const switchToDebito = ()=>{
    setForm({ fecha: form.fecha, tipoMovimiento:'DEBITO', cuentaContable:'', valor:0, descripcion:'' });
    setValorStr('');
  };

  const opciones = isCredito ? opcionesIngresosUI : cuentasEgresos.map(c=>({ label: c || 'Seleccione', value: c }));

  return (
    <div className="modal-backdrop"><div className="modal">
      <h2 className="hdr">{editing? 'Editar Transacción' : 'Nueva Transacción'}</h2>
      <p className="sub">La fecha no puede ser futura. El formulario se limpia al Añadir y al cambiar entre Ingresos/Egresos (excepto fecha).</p>
      <form onSubmit={onSubmit} className="grid grid-2">
        {/* Fecha — con atributo max=hoy para bloquear días futuros desde el selector */}
        <div>
          <label className="hdr" style={{fontSize:13}}>Fecha</label>
          <input
            type="date"
            className="input"
            value={form.fecha}
            max={hoy}
            onChange={e=>{
              const v = e.target.value;
              // Si el usuario forza una fecha futura (por teclado), cortar a hoy
              if (v && v > hoy) {
                setForm({ ...form, fecha: hoy });
              } else {
                setForm({ ...form, fecha: v });
              }
            }}
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="hdr" style={{fontSize:13}}>Tipo</label>
          <div className="flex" style={{gap:8}}>
            <button type="button" className={`btn ${isCredito? 'btn-success active':''}`} onClick={switchToCredito}>Ingresos</button>
            <button type="button" className={`btn ${!isCredito? 'btn-amber active':''}`} onClick={switchToDebito}>Egresos</button>
          </div>
        </div>

        {/* Cedula / Nombres solo para Ingresos */}
        {isCredito && (
          <div>
            <label className="hdr" style={{fontSize:13}}>Cedula</label>
            <input ref={cedulaRef} type="text" className="input" placeholder="Solo números" inputMode="numeric" value={form.cedula||''} onChange={handleCedulaChange}/>
          </div>
        )}
        {isCredito && (
          <div>
            <label className="hdr" style={{fontSize:13}}>Nombres y Apellidos</label>
            <input type="text" className="input" value={form.nombresApellidos||''} onChange={e=>setForm({...form, nombresApellidos: e.target.value})}/>
          </div>
        )}

        {/* Cuenta Contable */}
        <div>
          <label className="hdr" style={{fontSize:13}}>Cuenta Contable</label>
          <select ref={cuentaRef} className="select" value={form.cuentaContable} onChange={e=>setForm({...form, cuentaContable: e.target.value})}>
            {opciones.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="hdr" style={{fontSize:13}}>Valor</label>
          <input type="text" className="input" placeholder="0" inputMode="numeric" value={valorStr} onChange={handleValorChange}/>
        </div>

        {/* Descripción (OPCIONAL) */}
        <div className="span-2">
          <label className="hdr" style={{fontSize:13}}>Descripción (opcional)</label>
          <input className="input" placeholder="Puedes dejar en blanco" value={form.descripcion} onChange={e=>setForm({...form, descripcion: e.target.value})}/>
        </div>

        <div className="span-2 flex flex-end" style={{marginTop:8}}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div></div>
  );
}
