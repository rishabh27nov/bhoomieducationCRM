// Serve the existing serverless handlers inside Vite during local development.
// Production continues to use the same handlers through Vercel.
const routes = {
  '/api/whatsapp/students': () => import('../api/whatsapp/students.js'),
  '/api/whatsapp/messages': () => import('../api/whatsapp/messages.js'),
  '/api/whatsapp/send': () => import('../api/whatsapp/send.js'),
  '/api/whatsapp/replies': () => import('../api/whatsapp/replies.js'),
  '/api/whatsapp/settings': () => import('../api/whatsapp/settings.js'),
  '/api/whatsapp/automations': () => import('../api/whatsapp/automations.js'),
  '/api/whatsapp/cycles': () => import('../api/whatsapp/cycles.js'),
  '/api/whatsapp/execute-automations': () => import('../api/whatsapp/execute-automations.js'),
  '/api/webhooks/whatsapp': () => import('../api/webhooks/whatsapp.js'),
};

export async function localApiMiddleware(req, res, next) {
  const url = new URL(req.url, 'http://localhost');
  const load = routes[url.pathname];
  if (!load) return next();
  res.status = code => { res.statusCode = code; return res; };
  res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
  res.send = data => res.end(String(data));
  req.query = Object.fromEntries(url.searchParams);
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 1024 * 1024) return res.status(413).json({ error: 'Request too large.' });
    }
    try { req.body = body ? JSON.parse(body) : {}; }
    catch { return res.status(400).json({ error: 'Invalid JSON request.' }); }
    const { default: handler } = await load();
    await handler(req, res);
  } catch (error) {
    console.error('Local API request failed:', error.message);
    if (!res.writableEnded) res.status(503).json({ error: 'Student chat service is unavailable. Please retry.' });
  }
}

export default function localApiPlugin() {
  return {
    name: 'local-whatsapp-api',
    configureServer(server) { server.middlewares.use(localApiMiddleware); },
  };
}
