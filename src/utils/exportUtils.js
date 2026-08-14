/**
 * Export data to Excel (.csv format natively recognized by Microsoft Excel)
 */
export function exportToExcel(data, filename = 'Export_Data.csv') {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Get keys from first object
  const keys = Object.keys(data[0]);

  // Construct CSV content
  const headerRow = keys.map((key) => `"${key}"`).join(',');
  const dataRows = data.map((item) =>
    keys
      .map((key) => {
        let val = item[key] !== undefined && item[key] !== null ? String(item[key]) : '';
        // Escape quotes
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\n');

  // Add UTF-8 BOM so Excel opens Hindi / symbols correctly
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to clean PDF Document (Printable / Save as PDF)
 */
export function exportToPDF(title, columns, rows, filename = 'Report_Document.pdf', summaryBoxHtml = '') {
  if (!rows || rows.length === 0) {
    alert('No data available for PDF export.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF report.');
    return;
  }

  const tableHeaderHtml = columns.map((col) => `<th style="padding: 10px; border: 1px solid #cbd5e1; background-color: #0c2017; color: white; text-align: left; font-size: 12px;">${col}</th>`).join('');
  
  const tableRowsHtml = rows
    .map(
      (row) =>
        `<tr style="border-bottom: 1px solid #e2e8f0;">` +
        row.map((cell) => `<td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px;">${cell !== undefined && cell !== null ? cell : ''}</td>`).join('') +
        `</tr>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #225740; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0c2017; }
          .meta { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          tr:nth-child(even) { background-color: #f8faf9; }
          .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Lakshya CRM - ${title}</div>
            <div class="meta">Generated Date: ${new Date().toLocaleString()}</div>
          </div>
          <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background-color: #225740; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Save as PDF / Print</button>
        </div>

        ${summaryBoxHtml ? summaryBoxHtml : ''}

        <table>
          <thead>
            <tr>${tableHeaderHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Confidential Document • Lakshya NEET & JEE Educational Portal • Total Records: ${rows.length}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

