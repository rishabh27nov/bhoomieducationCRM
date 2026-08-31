const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// WhatsApp Client setup
// LocalAuth saves your session so you don't have to scan QR every time
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n==================================================');
    console.log('👇 IS QR CODE KO APNE WHATSAPP SE SCAN KAREIN 👇');
    console.log('==================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready and connected!');
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated successfully!');
});

client.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication failed', msg);
});

client.initialize();

// API to send message
app.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({ error: 'Number aur message dono bhejna zaruri hai.' });
        }

        // Clean number and add country code if missing
        let formattedNumber = String(number).replace(/\D/g, ''); 
        
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }

        const chatId = `${formattedNumber}@c.us`;

        // Check if number exists on WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        
        if (!isRegistered) {
            return res.status(404).json({ error: 'Yeh number WhatsApp par register nahi hai.' });
        }

        // Send message
        await client.sendMessage(chatId, message);

        res.status(200).json({ success: true, message: 'Message bhej diya gaya hai!' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Message bhejne me koi problem aayi.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Backend Server running on http://localhost:${PORT}`);
});
