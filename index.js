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
const SESSION_ID = "𝙰𝚂𝙸𝚃𝙷𝙰-𝙼𝙳=a53f0ff4ae233550"; // ඔයා දුන්න ID එක
const TARGET_NUMBER = "94757255903@s.whatsapp.net"; 
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

// --- RENDER ALIVE & PORT BINDING ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('N TECH OFC Bot is Active! 🚀'));
app.listen(port, () => console.log(`✅ Server listening on port ${port}`));

// --- SESSION DECODER ---
async function authInit() {
    const authPath = './auth_info_baileys';
    const credsPath = path.join(authPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        try {
            if (!fs.existsSync(authPath)) fs.mkdirSync(authPath);
            // Session ID එක base64 විදියට decode කර creds.json එක හදනවා
            const decodedData = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
            fs.writeFileSync(credsPath, decodedData);
            console.log("✅ Session Files Decoded Successfully!");
        } catch (err) {
            console.error("❌ Session ID Decoding Failed! ID එක නිවැරදිද බලන්න.");
        }
    }
}

async function startBot() {
    await authInit(); // මුලින්ම Session එක හදාගන්නවා
    
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
            console.log('🔄 සබඳතාවය බිඳ වැටුණා. නැවත උත්සාහ කරයි...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
            
            try {
                const connMsg = `🚀 *N TECH OFC - CONNECTION SUCCESS* 🚀\n\n` +
                                `> *Status:* Online\n` +
                                `බෝට් දැන් සාර්ථකව සම්බන්ධ වී ඇත.\n\n` +
                                `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;
                
                await sock.sendMessage(TARGET_NUMBER, { text: connMsg });
                console.log("📩 Success message sent to " + TARGET_NUMBER);
            } catch (e) {
                console.log("❌ Message Error: " + e.message);
            }
        }
    });

    // Auto Schedule: 4, 9, 15, 21 (Asia/Colombo)
    cron.schedule('0 5,9,15,21 * * *', async () => {
        console.log('🕒 වෙලාව හරි! පණිවිඩය යවනවා...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: mainMessage });
                console.log(`✅ Posted to ${jid}`);
            } catch (err) {
                console.error(`❌ Post failed: ${jid}`);
            }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
