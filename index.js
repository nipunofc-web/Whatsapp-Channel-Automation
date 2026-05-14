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

// --- CONFIG ---
const TARGET_NUMBER = "94757255903@s.whatsapp.net"; 
const channelJids = ['120363398681287064@newsletter', '120363413193872888@newsletter'];

// --- RENDER PORT BINDING (මේක අනිවාර්යයි) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is Alive 🚀'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

async function startBot() {
    // Session එක අලුතින්ම පටන් ගන්න
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
            console.log('✅ Connected!');
            // ඔයාගේ අනික් නම්බර් එකට මැසේජ් එක යවනවා
            await sock.sendMessage(TARGET_NUMBER, { text: "🚀 *N TECH OFC Connected!*\nබෝට් දැන් සක්‍රීයයි." });
        }
    });

    // Auto Post Schedule
    cron.schedule('0 4,9,15,21 * * *', async () => {
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: "පණිවිඩය මෙතනට..." });
            } catch (e) { console.log("Error sending to channel"); }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
