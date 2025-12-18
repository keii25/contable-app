
import { RootState } from './index';
export const selectTransacciones = (s: RootState) => s.transactions.items;
export const selectCuentas = (s: RootState) => s.transactions.cuentas;
export const selectCentros = (s: RootState) => s.transactions.centros;
