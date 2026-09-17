import http from 'http';
import sendWhatsApp from './api/whatsapp/send.js';
import whatsappWebhook from './api/webhooks/whatsapp.js';
import whatsappMessages from './api/whatsapp/messages.js';
import whatsappStudents from './api/whatsapp/students.js';
import whatsappReplies from './api/whatsapp/replies.js';
import whatsappSettings from './api/whatsapp/settings.js';
import whatsappAutomations from './api/whatsapp/automations.js';
import whatsappCycles from './api/whatsapp/cycles.js';
import executeAutomations from './api/whatsapp/execute-automations.js';
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
      if (dbObj && Array.isArray(dbObj.leads)) {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;
  const parsedUrl = new URL(url, 'http://localhost');
  const whatsappHandlers = {
    '/api/webhooks/whatsapp': whatsappWebhook,
    '/api/whatsapp/send': sendWhatsApp, '/api/whatsapp/messages': whatsappMessages,
    '/api/whatsapp/students': whatsappStudents, '/api/whatsapp/replies': whatsappReplies,
    '/api/whatsapp/settings': whatsappSettings, '/api/whatsapp/automations': whatsappAutomations,
    '/api/whatsapp/cycles': whatsappCycles, '/api/whatsapp/execute-automations': executeAutomations
  };
  if (whatsappHandlers[parsedUrl.pathname]) {
    req.query = Object.fromEntries(parsedUrl.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.send = data => res.end(String(data));
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        await whatsappHandlers[parsedUrl.pathname](req, res);
      } catch { if (!res.writableEnded) res.status(500).json({ error: 'Request failed' }); }
    });
    return;
  }

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

  // Meta (Facebook & Instagram) Webhooks Ingestion Endpoint
  if (url.startsWith('/api/webhooks/meta-leads')) {
    // GET verification handshake from Meta Developer Console
    if (req.method === 'GET') {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const mode = parsedUrl.searchParams.get('hub.mode');
      const token = parsedUrl.searchParams.get('hub.verify_token');
      const challenge = parsedUrl.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === 'bhoomi_crm_meta_token_2026') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        return;
      }
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Verification failed' }));
      return;
    }

    // POST webhook event (Incoming lead payload from Facebook/Instagram)
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const currentDb = loadDatabase();
          const platform = url.includes('instagram') ? 'Instagram Lead Ad' : 'Facebook Lead Form';
          
          const newLead = {
            id: `LEAD-META-${Date.now()}`,
            name: payload.name || payload.full_name || 'Meta Inquiry Student',
            phone: payload.phone || payload.phone_number || '+91 98765 00000',
            email: payload.email || 'meta.lead@bhoomieducation.com',
            course: payload.course || 'NEET / JEE Enquiry',
            city: payload.city || 'Online Meta Lead',
            source: platform,
            counselor: 'Unassigned',
            status: 'New Lead',
            createdAt: new Date().toISOString(),
            notes: `Auto-ingested from Meta Lead Ads. Awaiting Admin Counselor Assignment.`
          };

          currentDb.leads = [newLead, ...(currentDb.leads || [])];
          saveDatabase(currentDb);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, lead: newLead }));
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, note: 'Received payload' }));
        }
      });
      return;
    }
  }

  // WhatsApp API Webhooks
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
