
import { useSelector } from 'react-redux';
import { selectTransacciones } from '../store/selectors';
import { useMemo, useState } from 'react';
import { exportarPDFSimpleConEncabezado, generarCodigoCURDeterministico } from '../lib/pdf';
import type { Transaccion } from '../types';
import * as XLSX from 'xlsx';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function ymFromDateStr(d: string) { return d.slice(0,7); }
function groupByCuenta(list: Transaccion[]) {
  const map = new Map<string, number>();
  for (const t of list) {
    map.set(t.cuentaContable, (map.get(t.cuentaContable) || 0) + t.valor);
  }
  return Array.from(map.entries()).map(([cuenta, total]) => ({ cuenta, total })).sort((a,b)=> b.total - a.total);
}

export default function Reportes(){
  const items = useSelector(selectTransacciones);
  const anios = Array.from(new Set(items.map(t => t.fecha.slice(0,4)))).sort();
  const [scope, setScope] = useState<'GENERAL'|'MENSUAL'>('GENERAL');
  const [anioSel, setAnioSel] = useState<string>(anios[0] || new Date().getFullYear().toString());
  const [mesSel, setMesSel] = useState<number>(new Date().getMonth());

  const { ingresos, egresos, itemsPeriodo, periodoLabel, ingresosList, egresosList, resumenRows } = useMemo(()=>{
    const mm = String(mesSel+1).padStart(2,'0');
    const ym = `${anioSel}-${mm}`;
    const itemsPeriodo: Transaccion[] = (scope==='GENERAL'? items : items.filter(t => ymFromDateStr(t.fecha)===ym)).map(t=>{
      if (t.tipoMovimiento==='DEBITO') { const x:any={...t}; delete x.cedula; delete x.nombresApellidos; return x; }
      return t;
    });
    const ingresosList = itemsPeriodo.filter(t => t.tipoMovimiento==='CREDITO');
    const egresosList  = itemsPeriodo.filter(t => t.tipoMovimiento==='DEBITO');
    const ingresos = ingresosList.reduce((a,b)=>a+b.valor,0);
    const egresos = egresosList.reduce((a,b)=>a+b.valor,0);
    const periodoLabel = scope==='GENERAL'? 'General' : `${MESES[mesSel]} ${anioSel}`;
    const resumenRows = [
      ...groupByCuenta(ingresosList).map(r=>({ Tipo:'Ingresos', Cuenta:r.cuenta, Total:r.total })),
      ...groupByCuenta(egresosList).map(r=>({ Tipo:'Egresos',  Cuenta:r.cuenta, Total:r.total })),
    ];
    return { ingresos, egresos, itemsPeriodo, periodoLabel, ingresosList, egresosList, resumenRows };
  }, [items, scope, anioSel, mesSel]);

  const onPdf = () => {
    const cur = generarCodigoCURDeterministico({ anio: anioSel, mesIndex: mesSel, items: itemsPeriodo, ingresos, egresos });
    const now = new Date();
    const generadoEl = `${now.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' })} ${now.toLocaleTimeString('es-CO', { hour12:true })}`;
    exportarPDFSimpleConEncabezado({ titulo: 'IECP - Corozal', periodoLabel, ingresos, egresos, generadoEl, cur });
  };

  const onExcel = () => {
    // Construir workbook con 3 hojas: Ingresos, Egresos y Resumen
    const wb = XLSX.utils.book_new();

    const ingresosData = ingresosList.map(t => ({
      Fecha: t.fecha,
      Descripción: t.descripcion,
      Cuenta: t.cuentaContable,
      Cédula: t.cedula || '',
      'Nombres y Apellidos': t.nombresApellidos || '',
      Valor: t.valor,
    }));
    const egresosData = egresosList.map(t => ({
      Fecha: t.fecha,
      Descripción: t.descripcion,
      Cuenta: t.cuentaContable,
      Valor: t.valor,
    }));

    const wsIngresos = XLSX.utils.json_to_sheet(ingresosData);
    const wsEgresos  = XLSX.utils.json_to_sheet(egresosData);
    const wsResumen  = XLSX.utils.json_to_sheet(resumenRows.map(r=>({ Tipo: r.Tipo, Cuenta: r.Cuenta, Total: r.Total })));

    XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');
    XLSX.utils.book_append_sheet(wb, wsEgresos,  'Egresos');
    XLSX.utils.book_append_sheet(wb, wsResumen,  'Resumen');

    const now = new Date();
    const fechaStr = now.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-');
    const horaStr  = now.toLocaleTimeString('es-CO', { hour12:false }).replace(/:/g, '-');
    const fileName = `IECP_Reporte_${fechaStr}_${horaStr}_excel.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className='container'>
      <div className='card'>
        <div className='flex' style={{gap:10, alignItems:'center'}}>
          <label><strong>Filtro:</strong></label>
          <select className='select' value={scope} onChange={e=>setScope(e.target.value as any)}>
            <option value='GENERAL'>General</option>
            <option value='MENSUAL'>Por Mes y Año</option>
          </select>
          {scope==='MENSUAL' && (
            <>
              <label>Año:</label>
              <select className='select' value={anioSel} onChange={e=>setAnioSel(e.target.value)}>
                {anios.map(a=> <option key={a} value={a}>{a}</option>)}
              </select>
              <label>Mes:</label>
              <select className='select' value={mesSel} onChange={e=>setMesSel(Number(e.target.value))}>
                {MESES.map((m,i)=> <option key={m} value={i}>{m}</option>)}
              </select>
            </>
          )}
          <button className='btn btn-primary' onClick={onPdf}>Descargar PDF</button>
          <button className='btn btn-success' onClick={onExcel}>Descargar Excel</button>
        </div>
      </div>

      <div className='card' style={{marginTop:10}}>
        <p style={{color:'#16a34a'}}><strong>Ingresos:</strong> ${ingresos.toLocaleString()}</p>
        <p style={{color:'#dc2626'}}><strong>Egresos:</strong> ${egresos.toLocaleString()}</p>
        <p style={{color:'#2563eb'}}><strong>Saldo Neto:</strong> {(ingresos-egresos).toLocaleString()}</p>
      </div>

      {/* Listado de transacciones */}
      <div className='card' style={{marginTop:12}}>
        <div className='hdr'>Ingresos — Listado</div>
        <div style={{overflowX:'auto'}}>
          <table className='table'>
            <thead>
              <tr>
                <th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Cédula</th><th>Nombres y Apellidos</th><th style={{textAlign:'right'}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {ingresosList.map(t=> (
                <tr key={t.id}>
                  <td>{t.fecha}</td>
                  <td>{t.descripcion}</td>
                  <td>{t.cuentaContable}</td>
                  <td>{t.cedula}</td>
                  <td>{t.nombresApellidos}</td>
                  <td style={{textAlign:'right'}}>${t.valor.toLocaleString()}</td>
                </tr>
              ))}
              {ingresosList.length===0 && <tr><td colSpan={6} className='sub'>Sin registros de ingresos para el filtro seleccionado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className='card' style={{marginTop:12}}>
        <div className='hdr'>Egresos — Listado</div>
        <div style={{overflowX:'auto'}}>
          <table className='table'>
            <thead>
              <tr>
                <th>Fecha</th><th>Descripción</th><th>Cuenta</th><th style={{textAlign:'right'}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {egresosList.map(t=> (
                <tr key={t.id}>
                  <td>{t.fecha}</td>
                  <td>{t.descripcion}</td>
                  <td>{t.cuentaContable}</td>
                  <td style={{textAlign:'right'}}>${t.valor.toLocaleString()}</td>
                </tr>
              ))}
              {egresosList.length===0 && <tr><td colSpan={4} className='sub'>Sin registros de egresos para el filtro seleccionado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
