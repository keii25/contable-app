
const LS_KEY = 'iecp_transacciones_v1';
export async function loadInicial(key: string = LS_KEY): Promise<any[]> {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  if (key === LS_KEY) {
    const res = await fetch('/seed-transacciones.json');
    const data = await res.json();
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }
  return [];
}
export function saveTransacciones(transacciones: any[], key: string = LS_KEY) { localStorage.setItem(key, JSON.stringify(transacciones)); }
