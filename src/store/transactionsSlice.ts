
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Transaccion } from '../types';
import { transactionService } from '../services/transactionService';

const initialState: { items: Transaccion[]; cuentas: string[]; centros: string[]; nombresPorCedula: Record<string, string>; key: string; status: 'idle'|'loading'|'succeeded'|'failed' } = {
  items: [],
  cuentas: [ 'Diezmos','Ofrendas','Ofrendas Ministeriales','Otros', '5105 - Gastos de Aseo','5110 - Ayuda Social','5120 - Construcción y Mantenimiento','5145 - Diezmo de Diezmos','5130 - Aportes Fondo Nacional','5140 - Subsidio de Transporte','5150 - Impuesto Predial','5160 - Intereses de Cesantías','5170 - Mantenimiento','5180 - Misiones y Evangelismo','5185 - Ofrenda Ministerios','5190 - Otros Gastos','5200 - Emolumento Pastora','5210 - Servicios Públicos','5220 - Sonido y Multimedia','5230 - Emolumento Pastor','5240 - Tecnología','5250 - Útiles y Papelería','5260 - Vacaciones' ],
  centros: ['Sede Corozal','Administración','Proyectos'],
  nombresPorCedula: {},
  key: 'iecp_transacciones_v1',
  status: 'idle'
};

export const cargarTransacciones = createAsyncThunk('transactions/load', async (userId: string) => {
  console.log('📥 Loading transactions for userId:', userId, 'type:', typeof userId);
  const transactions = await transactionService.getTransactions(userId);
  console.log('📊 Raw transactions from service:', transactions);
  // Convertir formato de Supabase al formato local
  const converted = transactions.map(t => ({
    id: t.id,
    tipoMovimiento: t.type === 'ingreso' ? 'CREDITO' : 'DEBITO',
    monto: t.amount,
    descripcion: t.description,
    fecha: t.date,
    cuenta: t.category,
    centroCosto: 'Sede Corozal', // Valor por defecto
    cedula: '1010', // Valor por defecto para ingresos
    nombresApellidos: ''
  }));
  console.log('🔄 Converted transactions:', converted);
  return converted;
});

export const agregarTransaccion = createAsyncThunk('transactions/add', async ({ transaction, userId }: { transaction: Omit<Transaccion,'id'>; userId: string }) => {
  const result = await transactionService.addTransaction(transaction, userId);
  return {
    ...transaction,
    id: result.id
  };
});

export const actualizarTransaccion = createAsyncThunk('transactions/update', async ({ id, updates }: { id: string; updates: Partial<Transaccion> }) => {
  await transactionService.updateTransaction(id, updates);
  return { id, updates };
});

export const eliminarTransaccion = createAsyncThunk('transactions/delete', async (id: string) => {
  await transactionService.deleteTransaction(id);
  return id;
});

const slice = createSlice({
  name:'transactions',
  initialState,
  reducers: {
    // Mantener reducers locales para operaciones inmediatas si es necesario
  },
  extraReducers: (builder) => {
    builder
      .addCase(cargarTransacciones.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(cargarTransacciones.fulfilled, (state, action) => {
        console.log('✅ cargarTransacciones.fulfilled - payload:', action.payload);
        state.items = action.payload as Transaccion[];
        state.nombresPorCedula = {};
        state.items.forEach(t => {
          if (t.cedula && t.nombresApellidos) {
            state.nombresPorCedula[t.cedula] = t.nombresApellidos;
          }
        });
        state.status = 'succeeded';
        console.log('✅ State updated - items:', state.items.length, 'status:', state.status);
      })
      .addCase(cargarTransacciones.rejected, (state) => {
        console.error('❌ cargarTransacciones.rejected');
        state.status = 'failed';
      })
      .addCase(agregarTransaccion.fulfilled, (state, action) => {
        const nuevo = action.payload;
        if (!('centroCosto' in nuevo)) nuevo.centroCosto = 'Sede Corozal';
        if (nuevo.tipoMovimiento === 'DEBITO') {
          delete nuevo.cedula;
          delete nuevo.nombresApellidos;
        } else {
          if (!nuevo.cedula || !String(nuevo.cedula).trim()) nuevo.cedula = '1010';
          if (nuevo.cedula && nuevo.nombresApellidos) {
            state.nombresPorCedula[nuevo.cedula] = nuevo.nombresApellidos;
          }
        }
        state.items.push(nuevo as Transaccion);
      })
      .addCase(actualizarTransaccion.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const index = state.items.findIndex(t => t.id === id);
        if (index !== -1) {
          const upd = { ...state.items[index], ...updates } as Transaccion;
          if (upd.tipoMovimiento === 'DEBITO') {
            delete upd.cedula;
            delete upd.nombresApellidos;
          } else {
            if (upd.cedula && upd.nombresApellidos) {
              state.nombresPorCedula[upd.cedula] = upd.nombresApellidos;
            }
          }
          state.items[index] = upd;
        }
      })
      .addCase(eliminarTransaccion.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      });
  }
});

export default slice.reducer;
