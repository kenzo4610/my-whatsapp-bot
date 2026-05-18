const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

let latestQr = null;

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
        ]
    }
});

client.on('qr', (qr) => {
    latestQr = qr;
    qrcode.generate(qr, { small: true });
    console.log('QR CODE GENERATED! ദയവായി സ്കാൻ ചെയ്യുക:');
});

app.get('/', (req, res) => {
    if (latestQr) {
        res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot QR Code</title>
                    <meta http-equiv="refresh" content="15">
                </head>
                <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f0f2f5;">
                    <div style="background:white; padding:30px; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align:center;">
                        <h2 style="color:#075e54; margin-bottom:20px;">ദയവായി ഈ QR കോഡ് സ്കാൻ ചെയ്യുക</h2>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(latestQr)}" style="border:1px solid #ccc; padding:10px; border-radius:5px;" />
                        <p style="margin-top:20px; color:#555; font-size:14px;">ഈ പേജ് ഓരോ 15 സെക്കൻഡിലും തനിയെ റീഫ്രഷ് ആയിക്കോളും.</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f0f2f5;">
                    <div style="background:white; padding:30px; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align:center;">
                        <h2 style="color:#075e54;">വാട്സാപ്പ് ബോട്ട് ഓൺലൈൻ ആണ്!</h2>
                        <p style="color:#555;">QR കോഡ് ലോഡ് ആകുന്നു... കുറച്ച് സെക്കന്റുകൾക്ക് ശേഷം ഈ പേജ് റീഫ്രഷ് ചെയ്യുക.</p>
                    </div>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

let adminLastMessageTime = {};
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

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
            let replyText = `📢 *ഇൻആക്റ്റീവ് അഡ്മിൻ റിപ്പോർട്ട്* 📢\n\n`;
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
                replyText += `\n എല്ലാ അഡ്മിന്മാരും ആക്ടീവ് ആണ്.  `;
            }

            chat.sendMessage(replyText, { mentions: participants.filter(p => p.isAdmin || p.isSuperAdmin) });
        }
    }
});

client.initialize();
