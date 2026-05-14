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

// --- සැකසුම් (CONFIG) ---
const PAIR_NUMBER = "94743689803"; 
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

async function startBot() {
    // ඉතා වැදගත්: පරණ auth folder එකක් තිබේ නම් එය පාවිච්චි කරමින් පටන් ගනී
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
        browser: ["N TECH OFC", "Chrome", "1.0.0"], // මීට වඩා වෙනස් කරන්න එපා
    });

    // --- PAIRING CODE GENERATOR ---
    if (!sock.authState.creds.registered) {
        console.log(`⏳ ${PAIR_NUMBER} සඳහා Pairing Code එක සකසමින් පවතී...`);
        // Render එකට Port එක Bind වෙන්න වෙලාව දෙන්න
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(PAIR_NUMBER);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\n📢 ඔබගේ PAIRING CODE එක: ${code}\n\n`);
            } catch (err) {
                console.log("❌ Pairing Code error: " + err.message);
            }
        }, 10000); // තත්පර 10ක් රැඳී සිටීම
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 සබඳතාවය බිඳ වැටුණා. නැවත උත්සාහ කරයි...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
            
            // මැසේජ් එක යන බව තහවුරු කිරීම
            await sock.sendMessage(TARGET_NUMBER, { 
                text: "🚀 *N TECH OFC - CONNECTION SUCCESS*\n\nබෝට් දැන් Online ඇත." 
            });
        }
    });

    // Auto Schedule: 4, 9, 15, 21
    cron.schedule('0 4,9,15,21 * * *', async () => {
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
