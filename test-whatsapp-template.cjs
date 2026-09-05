const fs = require('fs');

async function test() {
  const db = JSON.parse(fs.readFileSync('./db/central_database.json', 'utf8'));
  const settings = db.whatsappSettings;
  const payload = {
    messaging_product: 'whatsapp',
    to: '918800215851',
    type: 'template',
    template: { name: 'hello_world', language: { code: 'en_US' } }
  };
  const res = await fetch(`https://graph.facebook.com/v19.0/${settings.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${settings.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(await res.json());
}
test();
