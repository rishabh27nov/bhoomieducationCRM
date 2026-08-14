import fs from 'fs';
import XLSX from 'xlsx';

try {
  const file = 'B2C Inside Sales.xlsx';
  const workbook = XLSX.readFile(file, { cellStyles: true, cellFills: true });
  
  console.log('Workbook Sheet Names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    console.log(`\n--- Sheet: ${sheetName} ---`);
    
    // Find range
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log(`Range: rows ${range.s.r} to ${range.e.r}, cols ${range.s.c} to ${range.e.c}`);

    let redRowsCount = 0;
    for (let r = range.s.r; r <= range.e.r; r++) {
      let isRedRow = false;
      let studentName = '';
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellAddress];
        if (cell) {
          if (cell.v && String(cell.v).length > 2 && !studentName && c >= 4 && c <= 8) {
            studentName = String(cell.v);
          }
          // Check fill style
          if (cell.s && cell.s.fgColor) {
            const rgb = cell.s.fgColor.rgb || cell.s.fgColor.theme;
            console.log(`Row ${r} Cell ${cellAddress} fgColor:`, cell.s.fgColor);
          }
        }
      }
    }
  });
} catch (e) {
  console.error('Error reading colors:', e.message);
}
