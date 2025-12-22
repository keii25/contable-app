
import jsPDF from 'jspdf';

function fnv1aHex(str: string){ let h=0x811c9dc5; for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); } return (h>>>0).toString(16).padStart(8,'0'); }
export function generarCodigoCURDeterministico(payload:{ anio:string; mesIndex:number; items:{id:string}[]; ingresos:number; egresos:number; }): string { const ids = payload.items.map(i=>i.id).sort(); const base = JSON.stringify({ a: payload.anio, m: payload.mesIndex, n: payload.items.length, ingresos: payload.ingresos, egresos: payload.egresos, ids }); const hex = fnv1aHex(base).slice(0,6).toUpperCase(); return `CUR-IGLC-${hex}`; }

export function isValidPdfFileName(name: string){
  // Formato esperado: IECP_Reporte_DD-MM-YYYY_HH-MM-SS.pdf
  const re = /^IECP_Reporte_\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.pdf$/;
  return re.test(name);
}

export function sanitizePdfFileName(name: string){
  // Reemplaza caracteres no permitidos por guión y asegura extensión .pdf
  const maxLen = 200;
  let base = name.replace(/[^a-zA-Z0-9._\-()\s]/g, '-');
  if (!base.toLowerCase().endsWith('.pdf')) base = base + '.pdf';
  if (base.length > maxLen) base = base.slice(0, maxLen - 4) + '.pdf';
  return base;
}

export function exportarPDFSimpleConEncabezado({ titulo, periodoLabel, ingresos, egresos, generadoEl, cur }:{ titulo:string; periodoLabel:string; ingresos:number; egresos:number; generadoEl:string; cur:string; }){
  const doc = new jsPDF({ unit:'pt', format:'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginTop = 60;
  const line = 16; // altura de línea
  const gap5 = line * 5; // separación grande
  const gap10 = line * 10;
  let y = marginTop;

  const center = (text:string, yPos:number, font:'normal'|'bold'='normal', size=12) => {
    doc.setFont('Helvetica', font); doc.setFontSize(size);
    doc.text(text, pageWidth/2, yPos, { align: 'center' } as any);
  };

  const saldo = ingresos - egresos;

  // Título
  center(titulo, y, 'bold', 16); y += line*1.6;
  // CUR y generado el
  center(`Código Único de Reporte: ${cur}`, y, 'normal', 11); y += line*1.2;
  center(`Generado el: ${generadoEl}`, y, 'normal', 11); y += line*1.8;
  center(`Periodo: ${periodoLabel}`, y, 'normal', 11); y += gap5;

  // Totales centrados con colores
  doc.setFont('Helvetica','bold'); doc.setFontSize(13);
  doc.setTextColor(16,185,129); // verde
  doc.text(`Ingresos: $ ${ingresos.toLocaleString()}`, pageWidth/2, y, { align: 'center' } as any); y += line*1.3;
  doc.setTextColor(239,68,68); // rojo
  doc.text(`Egresos:  $ ${egresos.toLocaleString()}`, pageWidth/2, y, { align: 'center' } as any); y += line*1.3;
  doc.setTextColor(59,130,246); // azul
  doc.text(`Saldo Neto: $ ${saldo.toLocaleString()}`, pageWidth/2, y, { align: 'center' } as any); y += gap10;
  doc.setTextColor(0,0,0);

  // Firma del Encargado centrada
  const lineWidth = 300;
  const startX = (pageWidth - lineWidth)/2;
  center('Firma del Encargado:', y, 'normal', 12); y += line*1.0;
  doc.line(startX, y, startX+lineWidth, y);

  // Nombre dinámico del archivo
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-');
  const horaStr  = now.toLocaleTimeString('es-CO', { hour12:false }).replace(/:/g, '-');
  const fileName = `IECP_Reporte_${fechaStr}_${horaStr}.pdf`;
  if (!isValidPdfFileName(fileName)){
    const safe = sanitizePdfFileName(fileName);
    console.warn(`[pdf] Nombre de archivo inválido: ${fileName} -> usando: ${safe}`);
    doc.save(safe);
  } else {
    doc.save(fileName);
  }
}
