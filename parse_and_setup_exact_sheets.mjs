import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const DB_FILE = path.join(process.cwd(), 'db.json');

function cleanPhone(val) {
  if (!val) return '+91 98765 00000';
  let str = String(val).replace(/\D/g, '');
  if (str.startsWith('91') && str.length === 12) {
    return `+91 ${str.slice(2, 7)} ${str.slice(7)}`;
  }
  if (str.length === 10) {
    return `+91 ${str.slice(0, 5)} ${str.slice(5)}`;
  }
  return String(val);
}

function cleanCourse(exam, level) {
  const e = String(exam || '').toLowerCase();
  const l = String(level || '').toLowerCase();
  
  if (e.includes('neet')) {
    return l.includes('12') || l.includes('bachelor') ? 'NEET Class 12' : 'NEET Class 11';
  }
  if (e.includes('jee')) {
    return l.includes('12') || l.includes('bachelor') ? 'JEE Class 12' : 'JEE Class 11';
  }
  if (e.includes('both')) {
    return 'NEET & JEE Integrated';
  }
  return 'NEET Class 11';
}

function cleanStage(statusText) {
  if (!statusText) return 'New Enquiry';
  const s = String(statusText).toLowerCase();
  if (s.includes('token') || s.includes('paid') || s.includes('admission') || s.includes('enrolled') || s.includes('pw')) {
    return 'Fee Paid & Enrolled';
  }
  if (s.includes('demo') || s.includes('webinar') || s.includes('talked') || s.includes('call back')) {
    return 'Demo Class Attended';
  }
  if (s.includes('schedule') || s.includes('counsel')) {
    return 'Counseling Scheduled';
  }
  if (s.includes('no') || s.includes('dnp') || s.includes('disconnect') || s.includes('not interested')) {
    return 'Unqualified / Dropped';
  }
  return 'New Enquiry';
}

function runImport() {
  console.log('🚀 Setting up Clean Office Roster (Niharika 67, Supriya 76, Rishabh yadav 0)...');

  const file = 'B2C Inside Sales.xlsx';
  if (!fs.existsSync(file)) {
    console.error(`File ${file} not found.`);
    return;
  }

  const workbook = XLSX.readFile(file);
  const leads = [];
  const counselorsSet = new Map();

  // ONLY real office employees
  counselorsSet.set('Rishabh yadav', { id: 'EMP-105', name: 'Rishabh yadav', role: 'Employee', email: 'rishubh27nov@gmail.com', phone: '9170072278', username: 'rishabh', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '100%', status: 'Active', joinedDate: '2025-02-01' });
  counselorsSet.set('Niharika', { id: 'EMP-106', name: 'Niharika', role: 'Manager', email: 'niharika@lakshyaedu.com', phone: '+91 98765 88990', username: 'niharika', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '88%', status: 'Active', joinedDate: '2024-05-10' });
  counselorsSet.set('Supriya', { id: 'EMP-107', name: 'Supriya', role: 'Employee', email: 'supriya@lakshyaedu.com', phone: '+91 98765 77665', username: 'supriya', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '82%', status: 'Active', joinedDate: '2024-08-01' });

  let idCounter = 1000;

  workbook.SheetNames.forEach((sheetName) => {
    // ONLY parse August Niharika and August Supriya sheets!
    const sName = sheetName.toLowerCase();
    if (!sName.includes('niharika') && !sName.includes('supriya')) return;

    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet);

    jsonRows.forEach((row) => {
      const name = row['full_name'] || row['Name '] || row['Name'] || row['student name'] || row['Premsingh Uikey'];
      if (!name || String(name).trim().length < 2) return;

      const cleanNameStr = String(name).trim();
      const phone = cleanPhone(row['whatsapp_number'] || row['Phone Number'] || row['Number'] || row['9.18085E+11']);
      const email = row['email'] || row['Email'] || row['poojauikey753@gmail.com'] || `${cleanNameStr.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
      const exam = row['which_exam_are_you_preparing_for?'] || row['neet'] || 'neet';
      const level = row['education_level'] || row['High school / GED'] || 'Class 11';
      const state = row['state'] || row['Sausar'] || 'Uttar Pradesh';

      let assignedCounselor = sName.includes('niharika') ? 'Niharika' : 'Supriya';

      // Extract status/note columns
      let statusLog = '';
      Object.keys(row).forEach((k) => {
        if (k.includes('Status') || k.includes('July') || k.includes('August') || k.includes('lead_status')) {
          if (row[k]) statusLog += `${k}: ${row[k]}; `;
        }
      });

      const stage = cleanStage(statusLog);
      const targetCourse = cleanCourse(exam, level);

      idCounter++;
      leads.push({
        id: `LKD-${idCounter}`,
        name: cleanNameStr,
        email: String(email).trim(),
        phone,
        targetCourse,
        batch: `Batch ${targetCourse.replace('Class ', '')} (${state})`,
        stage,
        score: Math.floor(Math.random() * 25) + 75,
        counselor: assignedCounselor,
        leadSource: `B2C Sales Sheet (${sheetName})`,
        createdAt: '2026-08-11',
        lastContact: 'Today',
        notes: statusLog || `B2C Lead from ${state}. Preparing for ${exam.toUpperCase()}`,
        feeBudget: '₹1,20,000 / year'
      });
    });
  });

  console.log(`\n✅ Total B2C Student Enquiries Parsed: ${leads.length}`);
  
  // Calculate active leads per counselor
  const employeesList = Array.from(counselorsSet.values());
  employeesList.forEach((emp) => {
    const empLeads = leads.filter((l) => l.counselor === emp.name);
    emp.activeLeads = empLeads.length;
    console.log(`👤 Counselor ${emp.name}: ${emp.activeLeads} Active Assigned Leads`);
  });

  const finalDb = {
    courses: ['NEET Class 11', 'NEET Class 12', 'JEE Class 11', 'JEE Class 12', 'NEET & JEE Integrated'],
    employees: employeesList,
    leads: leads,
    tasks: [
      { id: 'TSK-101', title: 'Call back Niharika lead: Sakharam Shinde', student: 'Sakharam Shinde', counselor: 'Niharika', dueDate: 'Today', dueTime: '04:00 PM', priority: 'High', type: 'Follow-up Call', completed: false },
      { id: 'TSK-102', title: 'Follow-up Niharika lead: Shyam Babu Buddha\'s', student: 'Shyam Babu Buddha\'s', counselor: 'Niharika', dueDate: 'Today', dueTime: '05:30 PM', priority: 'Urgent', type: 'Counseling Session', completed: false }
    ],
    activityLogs: [
      { id: 'ACT-1', employeeName: 'System Admin', action: 'Clean Office Setup', details: `Configured Niharika (${leads.filter(l=>l.counselor==='Niharika').length} leads), Supriya (${leads.filter(l=>l.counselor==='Supriya').length} leads), Rishabh yadav (0 leads)`, timestamp: '2026-08-12 12:55 AM' }
    ],
    notifications: [],
    attendanceRecords: {}
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(finalDb, null, 2), 'utf8');
  console.log('🎉 Central database db.json updated with clean staff roster!');

  // Also update mockData.js INITIAL_LEADS & COUNSELORS
  const mockDataPath = path.join(process.cwd(), 'src', 'data', 'mockData.js');
  if (fs.existsSync(mockDataPath)) {
    let mockContent = fs.readFileSync(mockDataPath, 'utf8');
    mockContent = mockContent.replace(/export const COUNSELORS = \[[\s\S]*?\];/m, `export const COUNSELORS = ${JSON.stringify(employeesList, null, 2)};`);
    mockContent = mockContent.replace(/export const INITIAL_LEADS = \[[\s\S]*?\];/m, `export const INITIAL_LEADS = ${JSON.stringify(leads, null, 2)};`);
    fs.writeFileSync(mockDataPath, mockContent, 'utf8');
    console.log('🎉 Updated mockData.js COUNSELORS & INITIAL_LEADS!');
  }
}

runImport();
