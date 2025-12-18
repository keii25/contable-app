
export type Transaccion = {
  id: string;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  tipoMovimiento: 'DEBITO'|'CREDITO';
  cuentaContable: string;
  valor: number;
  centroCosto: string;
  cedula?: string;
  nombresApellidos?: string;
};
export type FiltroTransacciones = {
  fechaDesde?: string;
  fechaHasta?: string;
  cuentaContable?: string;
  mesNombre?: string;
  cedula?: string;
  nombresApellidos?: string;
};
