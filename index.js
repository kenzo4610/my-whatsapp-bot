const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('വാട്സാപ്പ് ബോട്ട് ഓൺലൈൻ ആണ്!');
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session' 
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

let adminLastMessageTime = {}; 
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR CODE GENERATED! ദയവായി സ്കാൻ ചെയ്യുക:');
});

client.on('ready', () => {
    console.log('ബോട്ട് പൂർണ്ണമായും സജ്ജമായിക്കഴിഞ്ഞു!');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    
    if (chat.isGroup) {
        const groupId = chat.id._serialized;
        const senderId = msg.author || msg.from;
        const participants = chat.participants;
        const admins = participants.filter(p => p.isAdmin || p.isSuperAdmin).map(p => p.id._serialized);
        
        if (admins.includes(senderId)) {
            if (!adminLastMessageTime[groupId]) {
                adminLastMessageTime[groupId] = {};
            }
            adminLastMessageTime[groupId][senderId] = Date.now();
        }

        if (msg.body === '!checkadmins') {
            let replyText = `📢 *ഇൻആക്ടീവ് അഡ്മിൻ റിപ്പോർട്ട്* 📢\n\n`;
            let inactiveCount = 0;
            const currentTime = Date.now();

            for (let participant of participants) {
                if (participant.isAdmin || participant.isSuperAdmin) {
                    const adminId = participant.id._serialized;
                    const lastActive = adminLastMessageTime[groupId]?.[adminId];
                    const phoneNumber = adminId.split('@')[0];

                    if (!lastActive || (currentTime - lastActive > TWO_WEEKS_MS)) {
                        replyText += `❌ @${phoneNumber} (Active അല്ല)\n`;
                        inactiveCount++;
                    } else {
                        replyText += `✅ @${phoneNumber} (Active ആണ്)\n`;
                    }
                }
            }

            if (inactiveCount === 0) {
                replyText += `\nഎല്ലാ അഡ്മിൻമാരും ആക്ടീവ് ആണ്. 🔥`;
            }

            chat.sendMessage(replyText, { mentions: participants.filter(p => p.isAdmin || p.isSuperAdmin) });
        }
    }
});

client.initialize();