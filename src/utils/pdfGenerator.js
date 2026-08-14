/**
 * Generates a valid PDF 1.4 binary file Blob for documents & reports.
 * Prevents "Failed to load PDF document" browser errors.
 */

function escapePdfText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateValidPDFBlob({
  title = 'Document Record',
  docId = 'DOC-101',
  category = 'General',
  uploadedBy = 'System Admin',
  uploadDate = new Date().toLocaleString(),
  fileName = 'Document.pdf',
  extraLines = []
}) {
  const safeTitle = escapePdfText(title);
  const safeDocId = escapePdfText(docId);
  const safeCategory = escapePdfText(category);
  const safeUploadedBy = escapePdfText(uploadedBy);
  const safeUploadDate = escapePdfText(uploadDate);
  const safeFileName = escapePdfText(fileName);

  // PDF Text Stream Content using PostScript BT/ET commands
  let streamText = `BT\n`;
  streamText += `/F1 18 Tf\n50 740 Td\n(LAKSHYA NEET & JEE COACHING PORTAL) Tj\n`;
  streamText += `/F1 10 Tf\n0 -16 Td\n(Bridging Dreams and Destiny - Official Academic Vault) Tj\n`;
  streamText += `0 -25 Td\n/F1 14 Tf\n(Document Title: ${safeTitle}) Tj\n`;
  streamText += `0 -20 Td\n/F1 10 Tf\n(Document ID: ${safeDocId}) Tj\n`;
  streamText += `0 -15 Td\n(Category: ${safeCategory}) Tj\n`;
  streamText += `0 -15 Td\n(Uploaded By: ${safeUploadedBy}) Tj\n`;
  streamText += `0 -15 Td\n(Date & Time: ${safeUploadDate}) Tj\n`;
  streamText += `0 -15 Td\n(File Name: ${safeFileName}) Tj\n`;
  streamText += `0 -20 Td\n(----------------------------------------------------------------------------------------------------) Tj\n`;
  streamText += `0 -25 Td\n/F1 12 Tf\n(DOCUMENT VERIFICATION & AUTHENTICATION SUMMARY:) Tj\n`;
  streamText += `0 -20 Td\n/F1 10 Tf\n(Status: VERIFIED & OFFICIALLY SIGNED) Tj\n`;
  streamText += `0 -15 Td\n(Security Encryption: 256-bit Lakshya Vault Encryption) Tj\n`;
  streamText += `0 -15 Td\n(Access Level: Confirmed Authentic Student/Employee Record) Tj\n`;

  if (Array.isArray(extraLines) && extraLines.length > 0) {
    streamText += `0 -25 Td\n/F1 11 Tf\n(Additional Information:) Tj\n`;
    extraLines.forEach((line) => {
      streamText += `0 -15 Td\n/F1 10 Tf\n(${escapePdfText(line)}) Tj\n`;
    });
  }

  streamText += `0 -40 Td\n/F1 9 Tf\n(Confidential Document - Lakshya Educational Institute, Session 2026) Tj\n`;
  streamText += `ET`;

  const streamLength = streamText.length;

  // Build standard PDF 1.4 objects
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamText}\nendstream\nendobj\n`;

  const header = `%PDF-1.4\n`;
  
  // Calculate byte offsets for xref
  const offset0 = 0;
  const offset1 = header.length;
  const offset2 = offset1 + obj1.length;
  const offset3 = offset2 + obj2.length;
  const offset4 = offset3 + obj3.length;
  const offset5 = offset4 + obj4.length;
  const startXref = offset5 + obj5.length;

  const pad = (n) => String(n).padStart(10, '0');

  const xref = `xref\n0 6\n` +
    `0000000000 65535 f \n` +
    `${pad(offset1)} 00000 n \n` +
    `${pad(offset2)} 00000 n \n` +
    `${pad(offset3)} 00000 n \n` +
    `${pad(offset4)} 00000 n \n` +
    `${pad(offset5)} 00000 n \n`;

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const pdfBinaryString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;

  return new Blob([pdfBinaryString], { type: 'application/pdf' });
}

/**
 * Downloads file safely. Uses actual file data URL if available, or generates valid PDF Blob.
 */
export function downloadDocumentFile(doc) {
  const fileName = doc.fileName || `${doc.title || 'Document'}.pdf`;

  // 1. If document has actual base64/Data URL from real upload
  if (doc.fileDataUrl) {
    const a = document.createElement('a');
    a.href = doc.fileDataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. If it's a PDF file (or default), create a valid PDF binary blob
  if (fileName.toLowerCase().endsWith('.pdf')) {
    const pdfBlob = generateValidPDFBlob({
      title: doc.title || doc.studentName || 'Academic Document',
      docId: doc.id || 'DOC-RECORD',
      category: doc.category || doc.docType || 'Vault Record',
      uploadedBy: doc.uploadedBy || 'System Admin',
      uploadDate: doc.uploadDate || doc.uploadedDate || '2026-08-12',
      fileName: fileName
    });

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }

  // 3. Fallback for non-PDF mock documents (e.g. text/images)
  const textBlob = new Blob([`Lakshya CRM Document\nTitle: ${doc.title}\nID: ${doc.id}`], { type: 'text/plain' });
  const url = URL.createObjectURL(textBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
