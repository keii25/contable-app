
import { RootState } from './index';
export const selectTransacciones = (s: RootState) => s.transactions.items;
export const selectCuentas = (s: RootState) => s.transactions.cuentas;
export const selectAccountsByUser = (s: RootState, userId?: string) => {
	if (!userId) return [] as any[];
	return (s.transactions as any).accountsByUser?.[userId] || [];
};
export const selectAccountOptions = (s: RootState, userId?: string, tipo?: 'ingreso'|'egreso') => {
	const all = selectAccountsByUser(s, userId) || [];
	if (!all || all.length === 0) return [] as any[];
	if (!tipo) return all;
	return all.filter((a:any) => a.type === tipo);
};
export const selectCentros = (s: RootState) => s.transactions.centros;
export const selectTransactionsStatus = (s: RootState) => s.transactions.status;
