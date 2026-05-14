const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {

    console.log('WHATSAPP BOT READY');

    // YOUR CHANNEL ID
    const channelId = '120363XXXXXXX@newsletter';

    // 4 AM
    cron.schedule('0 4 * * *', async () => {
        await client.sendMessage(
            channelId,
            '🌅 සුභ උදෑසනක්!'
        );
    });

    // 9 AM
    cron.schedule('0 9 * * *', async () => {
        await client.sendMessage(
            channelId,
            '☀️ අද දවස හොඳට ගත කරන්න!'
        );
    });

    // 3 PM
    cron.schedule('0 15 * * *', async () => {
        await client.sendMessage(
            channelId,
            '🚀 Afternoon Update!'
        );
    });

    // 9 PM
    cron.schedule('0 21 * * *', async () => {
        await client.sendMessage(
            channelId,
            '🌙 සුභ රාත්‍රියක්!'
        );
    });

});

client.initialize();
