
import { useDispatch } from 'react-redux';
import { agregar, editar } from '../store/transactionsSlice';
import type { Transaccion } from '../types';
import { useEffect, useState } from 'react';

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
  const dispatch = useDispatch();
  const [form, setForm] = useState<FormData>({
    fecha: '', tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:''
  });
  const [valorStr, setValorStr] = useState('');

  // Limpiar TODOS los campos al abrir en modo Añadir (editing === null)
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
        setForm({ fecha:'', tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:'' });
        setValorStr('');
      }
    }
  }, [open, editing]);

  const onSubmit = (e:React.FormEvent)=>{
    e.preventDefault();
    // Validaciones esenciales
    if(!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) return alert('Fecha inválida (YYYY-MM-DD)');
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

    if(editing){ (dispatch as any)(editar({ ...(editing as any), ...payloadBase })); }
    else { (dispatch as any)(agregar(payloadBase)); }

    onClose(); onSaved();
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
    setForm({ ...form, cedula: digits });
  };

  const isCredito = form.tipoMovimiento==='CREDITO';

  // Cambiar tipo (Ingresos ↔ Egresos) y LIMPIAR todo
  const switchToCredito = ()=>{
    setForm({ fecha:'', tipoMovimiento:'CREDITO', cedula:'', nombresApellidos:'', cuentaContable:'', valor:0, descripcion:'' });
    setValorStr('');
  };
  const switchToDebito = ()=>{
    setForm({ fecha:'', tipoMovimiento:'DEBITO', cuentaContable:'', valor:0, descripcion:'' });
    setValorStr('');
  };

  const opciones = isCredito ? opcionesIngresosUI : cuentasEgresos.map(c=>({ label: c || 'Seleccione', value: c }));

  return (
    <div className="modal-backdrop"><div className="modal">
      <h2 className="hdr">{editing? 'Editar Transacción' : 'Nueva Transacción'}</h2>
      <p className="sub">La descripción es opcional. Al cambiar entre Ingresos/Egresos el formulario se limpiará.</p>
      <form onSubmit={onSubmit} className="grid grid-2">
        {/* Fecha */}
        <div>
          <label className="hdr" style={{fontSize:13}}>Fecha</label>
          <input type="date" className="input" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})}/>
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
            <input type="text" className="input" placeholder="Solo números" inputMode="numeric" value={form.cedula||''} onChange={handleCedulaChange}/>
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
          <select className="select" value={form.cuentaContable} onChange={e=>setForm({...form, cuentaContable: e.target.value})}>
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
