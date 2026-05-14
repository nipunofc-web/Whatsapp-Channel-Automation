const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');

// --- CONFIGURATIONS ---
const SESSION_ID = "𝙰𝚂𝙸𝚃𝙷𝙰-𝙼𝙳=ca74e89d806b3333"; 
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

// --- RENDER KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('N TECH OFC Bot Status: Active 🚀'));
app.listen(process.env.PORT || 10000);

// --- SESSION HANDLER ---
async function authInit() {
    const authPath = './auth_info_baileys';
    const credsPath = path.join(authPath, 'creds.json');

    if (!fs.existsSync(credsPath)) {
        try {
            if (!fs.existsSync(authPath)) fs.mkdirSync(authPath);
            const base64Data = SESSION_ID.split('=')[1];
            const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
            fs.writeFileSync(credsPath, decodedData);
            console.log("✅ Session Files Decoded Successfully!");
        } catch (err) {
            console.error("❌ Session ID Decoding Failed! Please check your ID.");
        }
    }
}

const mainMessage = `*​🎭 MONEY HEIST OFC TEAM 🎭*
> *​// ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ*
*​⚡ [01] DEPLOY MINIBOT* * https://nipunofc.store/moneyheist
*⚙️ [02] CORE CONFIGURATION* * https://nipunofc.store/minibot/setting
*​🔥 [03] MINING FREE COINS* * https://nipunofc.store/minibot/coin
*​💬 [04] NEURAL AUTO-REPLIES* * https://nipunofc.store/minibot/autoreply
*​📧 [05] DATABASE CLOUD SYNC* * https://nipunofc.store/minibot/contact
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;

async function startBot() {
    await authInit();
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
        browser: ["N TECH OFC", "Safari", "1.0.0"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Connected!');

            // --- PROFESSIONAL CONNECTED MESSAGE ---
            const connMsg = `🚀 *N TECH OFC - CONNECTION SUCCESS* 🚀\n\n` +
                            `> *Status:* Bot is now Online\n` +
                            `> *Session:* ASITHA-MD Active\n` +
                            `> *Work Type:* Auto Channel Post\n\n` +
                            `ඔබගේ බෝට් සාර්ථකව සම්බන්ධ විය. නියමිත වේලාවන්හිදී පණිවිඩ යැවීම සිදු කරනු ඇත.\n\n` +
                            `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;
            
            await sock.sendMessage(sock.user.id, { text: connMsg });
        }
    });

    // Schedule: 4AM, 9AM, 3PM (15), 9PM (21)
    cron.schedule('0 4,9,15,21 * * *', async () => {
        console.log('🕒 Time to post...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: mainMessage });
                console.log(`✅ Posted to ${jid}`);
            } catch (err) {
                console.error(`❌ Post failed for ${jid}`);
            }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
