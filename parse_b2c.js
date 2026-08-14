import fs from 'fs';
import XLSX from 'xlsx';

function inspect(file) {
  try {
    if (!fs.existsSync(file)) {
      console.log(`File ${file} does not exist.`);
      return;
    }
    console.log(`\n=================== ${file} ===================`);
    const workbook = XLSX.readFile(file);
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach((sheetName) => {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const sheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(sheet);
      console.log(`Total Rows: ${jsonRows.length}`);
      if (jsonRows.length > 0) {
        console.log('Column Headers:', Object.keys(jsonRows[0]));
        console.log('Sample Row 1:', JSON.stringify(jsonRows[0], null, 2));
        if (jsonRows.length > 1) {
          console.log('Sample Row 2:', JSON.stringify(jsonRows[1], null, 2));
        }
      }
    });
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

inspect('B2C Inside Sales.xlsx');
inspect('B2C Inside Sales (1).xlsx');
