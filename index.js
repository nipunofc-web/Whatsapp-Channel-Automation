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

// --- සැකසුම් (CONFIG) ---
const SESSION_ID = "1nF494DuFHuA10v"; // ඔයාගේ අලුත් Session ID එක
const TARGET_NUMBER = "94757255903@s.whatsapp.net"; // Connected බව දැනුම් දෙන නම්බර් එක
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

const mainMessage = `*​🎭 MONEY HEIST OFC TEAM 🎭*
> *​// ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ*
*​⚡ [01] DEPLOY MINIBOT* * https://nipunofc.store/moneyheist
*⚙️ [02] CORE CONFIGURATION* * https://nipunofc.store/minibot/setting
*​🔥 [03] MINING FREE COINS* * https://nipunofc.store/minibot/coin
*​💬 [04] NEURAL AUTO-REPLIES* * https://nipunofc.store/minibot/autoreply
*​📧 [05] DATABASE CLOUD SYNC* * https://nipunofc.store/minibot/contact
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;

// --- RENDER PORT FIX & ALIVE ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('N TECH OFC Bot Status: Active 🚀'));
app.listen(port, () => console.log(`✅ Server is running on port ${port}`));

// --- SESSION DECODER ---
async function authInit() {
    const authPath = './auth_info_baileys';
    const credsPath = path.join(authPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        try {
            if (!fs.existsSync(authPath)) fs.mkdirSync(authPath);
            const base64Data = SESSION_ID.split('=')[1];
            const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
            fs.writeFileSync(credsPath, decodedData);
            console.log("✅ Session Files Created Successfully!");
        } catch (err) {
            console.error("❌ Session ID Decoding Failed!");
        }
    }
}

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

            // 1. ඔයාගේ නම්බර් එකට Inbox මැසේජ් එකක් යවනවා
            await sock.sendMessage(TARGET_NUMBER, { 
                text: `🚀 *N TECH OFC - CONNECTED*\n\nඔබගේ බෝට් සාර්ථකව සම්බන්ධ විය.\nStatus: *Online*` 
            });

            // 2. ලින්ක් වුණු ගමන් චැනල් වලට මැසේජ් එක යැවීම (First Post)
            console.log('📢 Sending initial post to channels...');
            for (const jid of channelJids) {
                try {
                    await sock.sendMessage(jid, { text: mainMessage });
                } catch (e) { console.error("Error: " + jid); }
            }
        }
    });

    // Scheduled Posts: 4, 9, 15, 21
    cron.schedule('0 4,9,15,21 * * *', async () => {
        console.log('🕒 Scheduled Time reached. Posting...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: mainMessage });
            } catch (err) { console.error(`❌ Failed: ${jid}`); }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
