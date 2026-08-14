import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5000;
const DB_DIR = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_DIR, 'central_database.json');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial DB Structure
const INITIAL_DB = {
  attendanceRecords: {},
  courses: ['NEET Class 11', 'NEET Class 12', 'JEE Class 11', 'JEE Class 12'],
  employees: [],
  leads: [],
  tasks: [],
  activityLogs: [],
  notifications: []
};

// Load or create database file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const dbObj = JSON.parse(data);
      if (dbObj && Array.isArray(dbObj.leads) && dbObj.leads.length > 0) {
        return dbObj;
      }
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  // Fallback to db.json in root directory
  const rootDb = path.join(__dirname, 'db.json');
  if (fs.existsSync(rootDb)) {
    try {
      const data = fs.readFileSync(rootDb, 'utf8');
      const rootObj = JSON.parse(data);
      saveDatabase(rootObj);
      return rootObj;
    } catch {}
  }

  saveDatabase(INITIAL_DB);
  return INITIAL_DB;
}

function saveDatabase(dbData) {
  try {
    const str = JSON.stringify(dbData, null, 2);
    fs.writeFileSync(DB_FILE, str, 'utf8');
    const rootDb = path.join(__dirname, 'db.json');
    fs.writeFileSync(rootDb, str, 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Create HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers for cross-origin browser access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;

  // Health check endpoint
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Lakshya Central Database API Server Running', port: PORT }));
    return;
  }

  // GET /api/data -> Fetch entire central database
  if (req.method === 'GET' && (url === '/api/data' || url === '/api/attendance')) {
    const currentDb = loadDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentDb));
    return;
  }

  // POST /api/data -> Save & Merge central database state
  if (req.method === 'POST' && (url === '/api/data' || url === '/api/attendance')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const currentDb = loadDatabase();

        // Merge incoming attendance records carefully per date
        const updatedAttendance = { ...(currentDb.attendanceRecords || {}) };
        if (payload.attendanceRecords) {
          Object.keys(payload.attendanceRecords).forEach((dStr) => {
            updatedAttendance[dStr] = {
              ...(updatedAttendance[dStr] || {}),
              ...(payload.attendanceRecords[dStr] || {})
            };
          });
        }

        const mergedDb = {
          ...currentDb,
          ...payload,
          attendanceRecords: updatedAttendance,
          lastUpdated: new Date().toISOString()
        };

        saveDatabase(mergedDb);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Central DB Updated Successfully', db: mergedDb }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON Payload' }));
      }
    });
    return;
  }

  // 404 Route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 LAKSHYA CENTRAL DATABASE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/data`);
  console.log(`📁 Local Storage File: ${DB_FILE}`);
  console.log(`===================================================`);
});
