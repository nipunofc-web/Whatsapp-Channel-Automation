const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const puppeteer = require('puppeteer');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),

    puppeteer: {
        headless: true,
        executablePath: puppeteer.executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {

    console.log('BOT READY');

    // CHANNEL IDS
    const channels = [
        '120363413193872888@newsletter',
        '120363398681287064@newsletter'
    ];

    // MESSAGE
    const message = `🎭 MONEY HEIST OFC TEAM 🎭
> // ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ

⚡ [01] DEPLOY MINIBOT
https://nipunofc.store/moneyheist

⚙️ [02] CORE CONFIGURATION
https://nipunofc.store/minibot/setting

🔥 [03] MINING FREE COINS
https://nipunofc.store/minibot/coin

💬 [04] NEURAL AUTO-REPLIES
https://nipunofc.store/minibot/autoreply

📧 [05] DATABASE CLOUD SYNC
https://nipunofc.store/minibot/contact

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™`;

    // SEND FUNCTION
    async function sendToAllChannels() {

        for (const channel of channels) {

            try {

                await client.sendMessage(channel, message);

                console.log(`MESSAGE SENT TO ${channel}`);

            } catch (err) {

                console.log(`FAILED TO SEND TO ${channel}`);
                console.log(err);

            }

        }

    }

    // 4 AM
    cron.schedule('0 4 * * *', async () => {
        await sendToAllChannels();
    });

    // 9 AM
    cron.schedule('0 9 * * *', async () => {
        await sendToAllChannels();
    });

    // 3 PM
    cron.schedule('0 15 * * *', async () => {
        await sendToAllChannels();
    });

    // 9 PM
    cron.schedule('0 21 * * *', async () => {
        await sendToAllChannels();
    });

});

client.initialize();
