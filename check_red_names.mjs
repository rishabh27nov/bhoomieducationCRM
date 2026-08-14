import fs from 'fs';
import path from 'path';
import admZip from 'zlib';
import XLSX from 'xlsx';

// Check which names from the screenshot are in the excel sheets:
// "saurabh", "Sakharam Shinde", "Md Adnan Noori", "Mahesh Patidar", "khushahal. verma", "ravi kumar Sharmaji", "Vishnu"

const file1 = 'B2C Inside Sales.xlsx';
const file2 = 'B2C Inside Sales (1).xlsx';

[file1, file2].forEach((f) => {
  if (!fs.existsSync(f)) return;
  const wb = XLSX.readFile(f);
  wb.SheetNames.forEach((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach((r) => {
      const name = String(r['full_name'] || r['Name '] || r['Name'] || r['student name'] || '').trim();
      if (['saurabh', 'Md Adnan Noori', 'Mahesh Patidar', 'khushahal. verma', 'ravi kumar Sharmaji', 'Vishnu'].some(n => name.toLowerCase().includes(n.toLowerCase()))) {
        console.log(`Found in file "${f}", sheet "${sheetName}": name="${name}"`);
      }
    });
  });
});
