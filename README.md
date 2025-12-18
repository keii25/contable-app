
# IECP Contabilidad v4.1 — v1.6.7 (Rebuild)

Cambios aplicados:
- Confirmación al editar (botón **Editar**, azul) y al eliminar (botón **Eliminar**, rojo).
- `TransactionsTable.tsx` con filtros controlados + botón **Limpiar** + línea de nombresApellidos corregida.
- `Transacciones.tsx` importa el componente correctamente.
- `Dashboard` muestra subconceptos de Ingresos/Egresos con totales, por **Ámbito** (General/Mes y Año).
- PDF: función `exportarPDFSimpleConEncabezado` (título **IECP - Corozal**, CUR `CUR-IGLC-XXXXXX`, "Generado el", totales, firma) y **nombre de archivo dinámico** con fecha/hora.
- `TransactionForm` con **descripción opcional**.

## Ejecutar:
```bash
npm i
npm run dev
```
