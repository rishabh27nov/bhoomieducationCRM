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
  console.log('🚀 Re-assigning all B2C Student Enquiries (Fiza qurashe, V A S U, Pappu Gurjar, etc.) to Niharika...');

  const files = ['B2C Inside Sales.xlsx', 'B2C Inside Sales (1).xlsx'];
  const leads = [];
  const counselorsSet = new Map();

  // Define counselors
  counselorsSet.set('Niharika', { id: 'EMP-106', name: 'Niharika', role: 'Manager', email: 'niharika@lakshyaedu.com', phone: '+91 98765 88990', username: 'niharika', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '88%', status: 'Active', joinedDate: '2024-05-10' });
  counselorsSet.set('Supriya', { id: 'EMP-107', name: 'Supriya', role: 'Employee', email: 'supriya@lakshyaedu.com', phone: '+91 98765 77665', username: 'supriya', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '82%', status: 'Active', joinedDate: '2024-08-01' });
  counselorsSet.set('Rishabh yadav', { id: 'EMP-105', name: 'Rishabh yadav', role: 'Employee', email: 'rishubh27nov@gmail.com', phone: '9170072278', username: 'rishabh', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '100%', status: 'Active', joinedDate: '2025-02-01' });
  counselorsSet.set('Ananya Sharma', { id: 'EMP-101', name: 'Ananya Sharma', role: 'Manager', email: 'ananya.s@lakshyaedu.com', phone: '+91 98765 11122', username: 'ananya101', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '78%', status: 'Active', joinedDate: '2024-03-15' });
  counselorsSet.set('Rahul Verma', { id: 'EMP-102', name: 'Rahul Verma', role: 'Employee', email: 'rahul.v@lakshyaedu.com', phone: '+91 98765 22233', username: 'rahul102', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '82%', status: 'Active', joinedDate: '2024-06-01' });
  counselorsSet.set('Priya Nair', { id: 'EMP-103', name: 'Priya Nair', role: 'Manager', email: 'priya.n@lakshyaedu.com', phone: '+91 98765 33344', username: 'priya103', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '71%', status: 'Active', joinedDate: '2023-11-10' });
  counselorsSet.set('Vikram Mehta', { id: 'EMP-104', name: 'Vikram Mehta', role: 'Employee', email: 'vikram.m@lakshyaedu.com', phone: '+91 98765 44455', username: 'vikram104', password: 'emp123', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', activeLeads: 0, conversion: '85%', status: 'Active', joinedDate: '2025-01-20' });

  let idCounter = 1000;
  const processedNames = new Set();

  files.forEach((file) => {
    if (!fs.existsSync(file)) return;
    const workbook = XLSX.readFile(file);
    workbook.SheetNames.forEach((sheetName) => {
      if (sheetName.toLowerCase().includes('reimbursement')) return;

      const sheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(sheet);

      jsonRows.forEach((row) => {
        const name = row['full_name'] || row['Name '] || row['Name'] || row['student name'] || row['Premsingh Uikey'];
        if (!name || String(name).trim().length < 2) return;

        const cleanNameStr = String(name).trim();
        const key = cleanNameStr.toLowerCase();
        if (processedNames.has(key)) return;
        processedNames.add(key);

        const phone = cleanPhone(row['whatsapp_number'] || row['Phone Number'] || row['Number'] || row['9.18085E+11']);
        const email = row['email'] || row['Email'] || row['poojauikey753@gmail.com'] || `${cleanNameStr.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
        const exam = row['which_exam_are_you_preparing_for?'] || row['neet'] || 'neet';
        const level = row['education_level'] || row['High school / GED'] || 'Class 11';
        const state = row['state'] || row['Sausar'] || 'Uttar Pradesh';

        // Explicit Counselor Assignment:
        // Default B2C counselor is Niharika unless explicitly Supriya or Rishabh!
        let sheetCounselor = 'Niharika';
        if (sheetName.toLowerCase().includes('supriya')) {
          sheetCounselor = 'Supriya';
        } else if (sheetName.toLowerCase().includes('rishabh')) {
          sheetCounselor = 'Rishabh yadav';
        } else {
          sheetCounselor = 'Niharika';
        }

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
          counselor: sheetCounselor,
          leadSource: `B2C Sales Sheet (${sheetName})`,
          createdAt: '2026-08-11',
          lastContact: 'Today',
          notes: statusLog || `B2C Lead from ${state}. Preparing for ${exam.toUpperCase()}`,
          feeBudget: '₹1,20,000 / year'
        });
      });
    });
  });

  console.log(`\n✅ Successfully assigned B2C Student Enquiries!`);
  
  // Calculate active leads per counselor
  const employeesList = Array.from(counselorsSet.values());
  employeesList.forEach((emp) => {
    const empLeads = leads.filter((l) => l.counselor === emp.name);
    emp.activeLeads = empLeads.length;
    console.log(`👤 Counselor ${emp.name}: ${emp.activeLeads} Assigned Leads`);
  });

  const finalDb = {
    courses: ['NEET Class 11', 'NEET Class 12', 'JEE Class 11', 'JEE Class 12', 'NEET & JEE Integrated'],
    employees: employeesList,
    leads: leads,
    tasks: [
      { id: 'TSK-101', title: 'Call back Niharika lead: Fiza qurashe', student: 'Fiza qurashe', counselor: 'Niharika', dueDate: 'Today', dueTime: '04:00 PM', priority: 'High', type: 'Follow-up Call', completed: false },
      { id: 'TSK-102', title: 'Follow-up Niharika lead: Pappu Gurjar', student: 'Pappu Gurjar', counselor: 'Niharika', dueDate: 'Today', dueTime: '05:30 PM', priority: 'Urgent', type: 'Counseling Session', completed: false }
    ],
    activityLogs: [
      { id: 'ACT-1', employeeName: 'Niharika', action: 'B2C Leads Assigned', details: `Assigned ${leads.filter(l => l.counselor === 'Niharika').length} B2C student enquiries to Niharika`, timestamp: '2026-08-11 05:51 PM' }
    ],
    notifications: [],
    attendanceRecords: {}
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(finalDb, null, 2), 'utf8');
  console.log('🎉 Central database db.json updated!');

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
