
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Transaccion } from '../types';
import { loadInicial, saveTransacciones } from '../lib/persist';

const initialState: { items: Transaccion[]; cuentas: string[]; centros: string[]; status: 'idle'|'loading'|'succeeded'|'failed' } = {
  items: [],
  cuentas: [ 'Diezmos','Ofrendas','Ofrendas Ministeriales','Otros', '5105 - Gastos de Aseo','5110 - Ayuda Social','5120 - Construcción y Mantenimiento','5145 - Diezmo de Diezmos','5130 - Aportes Fondo Nacional','5140 - Subsidio de Transporte','5150 - Impuesto Predial','5160 - Intereses de Cesantías','5170 - Mantenimiento','5180 - Misiones y Evangelismo','5185 - Ofrenda Ministerios','5190 - Otros Gastos','5200 - Emolumento Pastora','5210 - Servicios Públicos','5220 - Sonido y Multimedia','5230 - Emolumento Pastor','5240 - Tecnología','5250 - Útiles y Papelería','5260 - Vacaciones' ],
  centros: ['Sede Corozal','Administración','Proyectos'],
  status: 'idle'
};

export const cargarTransacciones = createAsyncThunk('transactions/load', async () => await loadInicial());

const slice = createSlice({ name:'transactions', initialState, reducers: {
  agregar(state, action: PayloadAction<Omit<Transaccion,'id'>>){ const nuevo = { ...action.payload, id: crypto.randomUUID() } as Transaccion; if (!('centroCosto' in nuevo)) nuevo.centroCosto = 'Sede Corozal'; if (nuevo.tipoMovimiento === 'DEBITO') { delete nuevo.cedula; delete nuevo.nombresApellidos; } else { if (!nuevo.cedula || !String(nuevo.cedula).trim()) nuevo.cedula = '1010'; } state.items.push(nuevo); saveTransacciones(state.items); },
  editar(state, action: PayloadAction<Transaccion>){ const upd = { ...action.payload } as Transaccion; if (upd.tipoMovimiento === 'DEBITO') { delete upd.cedula; delete upd.nombresApellidos; } state.items = state.items.map(t=> t.id===upd.id? upd : t); saveTransacciones(state.items); },
  eliminar(state, action: PayloadAction<string>){ state.items = state.items.filter(t=> t.id!==action.payload); saveTransacciones(state.items); },
}, extraReducers: b=>{ b.addCase(cargarTransacciones.pending, s=>{ s.status='loading'; }) .addCase(cargarTransacciones.fulfilled, (s,a)=>{ s.items = a.payload as Transaccion[]; s.status='succeeded'; }) .addCase(cargarTransacciones.rejected, s=>{ s.status='failed'; }); } });

export const { agregar, editar, eliminar } = slice.actions;
export default slice.reducer;
