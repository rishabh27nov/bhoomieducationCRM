const fs = require('fs');

async function test() {
  const db = JSON.parse(fs.readFileSync('./db/central_database.json', 'utf8'));
  const settings = db.whatsappSettings;
  if (!settings) {
    console.log('No settings found');
    return;
  }
  
  const payload = {
    messaging_product: 'whatsapp',
    to: '918800215851', // with 91 or without? Meta usually requires country code!
    type: 'text',
    text: { body: 'Test from script' }
  };
  
  console.log('Sending payload:', payload);

  const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${settings.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await metaResponse.json();
  console.log('Meta API Response:', JSON.stringify(result, null, 2));
}

test();
