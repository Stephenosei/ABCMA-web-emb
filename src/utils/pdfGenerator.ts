import { GazettedDocument } from '../types';

function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, (char) => {
      if (char === '\u2013' || char === '\u2014') return '-';
      if (char === '\u2018' || char === '\u2019') return "'";
      if (char === '\u201C' || char === '\u201D') return '"';
      return ' ';
    })
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface PdfLine {
  text: string;
  font: 'F1' | 'F2'; // F1 = Helvetica, F2 = Helvetica-Bold
  size: number;
  spaceBefore?: number;
}

function buildPdfBytes(lines: PdfLine[]): Uint8Array {
  const encoder = new TextEncoder();

  // Build content stream commands for a standard Letter page (612 x 792 pt)
  const commands: string[] = [];
  let y = 740;
  const leftMargin = 54;

  // Header accent bar
  commands.push('0.02 0.35 0.24 rg');
  commands.push('54 756 504 6 re f');
  commands.push('0 0 0 rg');

  for (const line of lines) {
    y -= line.spaceBefore || 0;
    if (y < 64) break;
    commands.push('BT');
    commands.push(`/${line.font} ${line.size} Tf`);
    commands.push(`${leftMargin} ${y} Td`);
    commands.push(`(${escapePdfText(line.text)}) Tj`);
    commands.push('ET');
    y -= Math.round(line.size * 1.45);
  }

  // Footer rule & certification
  commands.push('0.82 0.85 0.88 RG');
  commands.push('0.8 w');
  commands.push('54 52 m 558 52 l S');
  commands.push('BT');
  commands.push('/F1 8 Tf');
  commands.push('0.35 0.40 0.45 rg');
  commands.push('54 38 Td');
  commands.push('(Ablekuma Central Municipal Assembly \\(ABCMA\\) - Lartebiokorshie, Accra - Official Public Gazette Copy) Tj');
  commands.push('ET');

  const streamContent = commands.join('\n');
  const streamLength = encoder.encode(streamContent).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  const header = '%PDF-1.4\n';
  let body = header;
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(body).length);
    body += obj;
  }

  const xrefStart = encoder.encode(body).length;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return encoder.encode(body + xref + trailer);
}

export function getDocumentFilename(doc: GazettedDocument): string {
  if (doc.fileName) return doc.fileName;
  const slug = doc.title
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return `${slug || doc.id}.pdf`;
}

export function downloadOfficialPdf(doc: GazettedDocument): string {
  const lines: PdfLine[] = [
    { text: 'REPUBLIC OF GHANA · GREATER ACCRA REGION', font: 'F2', size: 9 },
    { text: 'ABLEKUMA CENTRAL MUNICIPAL ASSEMBLY (ABCMA)', font: 'F2', size: 15, spaceBefore: 2 },
    { text: 'Municipal Assembly Complex, Lartebiokorshie · GhanaPostGPS: GA-140-2210', font: 'F1', size: 9, spaceBefore: 2 },
    { text: '___________________________________________________________________________', font: 'F1', size: 10, spaceBefore: 4 },
  ];

  for (const titleLine of wrapText(doc.title, 62)) {
    lines.push({ text: titleLine, font: 'F2', size: 14, spaceBefore: 6 });
  }

  lines.push({
    text: `Category: ${doc.category}  |  Reference: ${doc.gazetteNumber}  |  Year: ${doc.year}`,
    font: 'F1',
    size: 9,
    spaceBefore: 6,
  });

  if (doc.department) {
    lines.push({
      text: `Issuing Directorate: ${doc.department}`,
      font: 'F1',
      size: 9,
      spaceBefore: 2,
    });
  }

  lines.push({ text: '1. EXECUTIVE SUMMARY & STATUTORY PURPOSE', font: 'F2', size: 11, spaceBefore: 14 });
  for (const sumLine of wrapText(doc.summary, 84)) {
    lines.push({ text: sumLine, font: 'F1', size: 10, spaceBefore: 2 });
  }

  const provisions =
    doc.keyProvisions && doc.keyProvisions.length > 0
      ? doc.keyProvisions
      : [
          'Enacted and gazetted pursuant to the Local Governance Act, 2016 (Act 936) and Legislative Instrument L.I. 2376.',
          'Applicable across all 7 electoral areas: Abossey Okai, Lartebiokorshie, Mataheko, Gbortsui, Sukura, Town Council Line, and Mabrouk.',
          'Citizens and business operators may request certified physical copies at the Client Service Unit, Block A, Lartebiokorshie.',
        ];

  lines.push({ text: '2. KEY PROVISIONS & PUBLIC SCHEDULES', font: 'F2', size: 11, spaceBefore: 14 });
  provisions.forEach((item, idx) => {
    const wrapped = wrapText(`${idx + 1}. ${item}`, 82);
    wrapped.forEach((wLine, wIdx) => {
      lines.push({
        text: wIdx === 0 ? wLine : `   ${wLine}`,
        font: 'F1',
        size: 10,
        spaceBefore: wIdx === 0 ? 4 : 1,
      });
    });
  });

  lines.push({ text: '3. AUTHENTICATION & PUBLIC INSPECTION', font: 'F2', size: 11, spaceBefore: 14 });
  for (const authLine of wrapText(
    'Certified true public record published on the Ablekuma Central Municipal Assembly Official Portal (https://abcma.gov.gh). For verification or inquiries, contact info@abcma.gov.gh or 0302-228-900.',
    84
  )) {
    lines.push({ text: authLine, font: 'F1', size: 9, spaceBefore: 2 });
  }

  const bytes = buildPdfBytes(lines);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const fileName = getDocumentFilename(doc);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return fileName;
}
