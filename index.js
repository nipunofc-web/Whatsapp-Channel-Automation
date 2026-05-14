const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');
const express = require('express'); // අලුතින් එක් කළා

// --- RENDER PORT FIX ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running! 🚀'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

// --- BOT CONFIG ---
const BOT_NUMBER = "94743689803"; 
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

const messageText = `*​🎭 MONEY HEIST OFC TEAM 🎭*
> *​// ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ*
*​⚡ [01] DEPLOY MINIBOT* * https://nipunofc.store/moneyheist
*⚙️ [02] CORE CONFIGURATION* * https://nipunofc.store/minibot/setting
*​🔥 [03] MINING FREE COINS* * https://nipunofc.store/minibot/coin
*​💬 [04] NEURAL AUTO-REPLIES* * https://nipunofc.store/minibot/autoreply
*​📧 [05] DATABASE CLOUD SYNC* * https://nipunofc.store/minibot/contact
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["N Tech Bot", "Chrome", "1.0.0"]
    });

    if (!sock.authState.creds.registered) {
        console.log("⏳ Pairing Code එක සකසමින් පවතී...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(BOT_NUMBER);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\n✅ ඔබගේ Pairing Code එක: ${code}\n\n`);
            } catch (err) {
                console.log("❌ කෝඩ් එක ගන්න බැරි වුණා. විනාඩි 5ක් ඉන්න.");
            }
        }, 10000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
        }
    });

    cron.schedule('0 4,9,15,21 * * *', async () => {
        console.log('🕒 වෙලාව හරි! Channels වලට යවනවා...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: messageText });
                console.log(`✅ පණිවිඩය යැවුවා: ${jid}`);
            } catch (err) {
                console.error(`❌ වැරදුනා: ${jid}`);
            }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
