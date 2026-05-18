const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR CODE GENERATED! ദയവായി സ്കാൻ ചെയ്യുക:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('നിങ്ങളുടെ വാട്സാപ്പ് ബോട്ട് വിജയകരമായി കണക്ട് ആയിട്ടുണ്ട്!');
});

client.on('message', async (message) => {
    if (message.body.toLowerCase() === 'ping') {
        await message.reply('pong');
    }
});

client.initialize();
