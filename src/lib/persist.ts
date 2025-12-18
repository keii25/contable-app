
const LS_KEY = 'iecp_transacciones_v1';
export async function loadInicial(): Promise<any[]> {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);
  const res = await fetch('/seed-transacciones.json');
  const data = await res.json();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data;
}
export function saveTransacciones(transacciones: any[]) { localStorage.setItem(LS_KEY, JSON.stringify(transacciones)); }
