const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client({

    authStrategy: new LocalAuth({
        dataPath: './session'
    }),

    puppeteer: {
        headless: true,

        executablePath:
            process.env.PUPPETEER_EXECUTABLE_PATH ||
            '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]

    }

});

client.on('qr', (qr) => {

    console.log('SCAN THIS QR CODE');

    qrcode.generate(qr, {
        small: true
    });

});

client.on('ready', async () => {

    console.log('BOT READY 😒');

    const channels = [
        '120363413193872888@newsletter',
        '120363398681287064@newsletter'
    ];

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

    async function sendMessages() {

        for (const channel of channels) {

            try {

                await client.sendMessage(channel, message);

                console.log(`MESSAGE SENT TO ${channel}`);

            } catch (err) {

                console.log(`FAILED ${channel}`);
                console.log(err);

            }

        }

    }

    cron.schedule('0 4 * * *', sendMessages);
    cron.schedule('0 9 * * *', sendMessages);
    cron.schedule('0 15 * * *', sendMessages);
    cron.schedule('0 21 * * *', sendMessages);

});

client.initialize();
