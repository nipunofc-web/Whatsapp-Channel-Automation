const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    jidNormalizedUser 
} = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const SESSION_ID = "desam_mp629xqg_7au0emt4"; 
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

const app = express();
app.get('/', (req, res) => res.send('N TECH OFC Bot is Online 🚀'));
app.listen(process.env.PORT || 10000);

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
            console.error("❌ Session ID Decoding Failed!");
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
        browser: ["N TECH OFC", "Chrome", "1.0.0"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Connected Successfully!');

            // --- Inbox එකට මැසේජ් එක යැවීම ---
            try {
                // සැබෑ User ID එක ලබා ගැනීම
                const myId = jidNormalizedUser(sock.user.id);
                
                const connMsg = `🚀 *N TECH OFC - CONNECTION SUCCESS* 🚀\n\n` +
                                `> *Status:* Online\n` +
                                `> *Session:* ASITHA-MD Active\n\n` +
                                `ඔබගේ බෝට් දැන් සාර්ථකව සම්බන්ධ වී ඇත.\n\n` +
                                `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;
                
                await sock.sendMessage(myId, { text: connMsg });
                console.log("📩 Connection message sent to inbox!");
            } catch (e) {
                console.log("❌ Could not send inbox message: " + e.message);
            }
        }
    });

    cron.schedule('0 4,9,15,21 * * *', async () => {
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
