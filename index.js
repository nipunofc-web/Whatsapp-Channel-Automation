const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');

// --- සැකසුම් (CONFIGURATIONS) ---
const BOT_NUMBER = "94757255903"; // මෙතනට ඔයාගේ නම්බර් එක දාන්න
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

const messageText = `*​🎭 MONEY HEIST OFC TEAM 🎭*
> *​// ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ*
*​⚡ [01] DEPLOY MINIBOT* * https://nipunofc.store/moneyheist

*⚙️ [02] CORE CONFIGURATION*
* https://nipunofc.store/minibot/setting

*​🔥 [03] MINING FREE COINS* * https://nipunofc.store/minibot/coin

*​💬 [04] NEURAL AUTO-REPLIES*
* https://nipunofc.store/minibot/autoreply

*​📧 [05] DATABASE CLOUD SYNC*
* https://nipunofc.store/minibot/contact
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
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Pairing Code එක ලබා ගැනීම (ලොග් වී නැත්නම් පමණක්)
    if (!sock.authState.creds.registered) {
        console.log("⏳ Pairing Code එක සකසමින් පවතී...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(BOT_NUMBER);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\n✅ ඔබගේ WhatsApp Pairing Code එක: ${code}\n\n`);
            } catch (err) {
                console.log("❌ Pairing code ලබා ගැනීමට අපහසුයි. කරුණාකර මද වෙලාවකින් නැවත උත්සාහ කරන්න.");
            }
        }, 6000); // තත්පර 6ක් රැඳී සිටින්න
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 සම්බන්ධතාවය බිඳ වැටුණි. නැවත සම්බන්ධ වෙමින්...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
        }
    });

    // කාලසටහන (Sri Lanka Time)
    // උදේ 4, උදේ 9, දවල් 3 (15:00), රෑ 9 (21:00)
    cron.schedule('0 4,9,15,21 * * *', async () => {
        console.log('🕒 පණිවිඩය යැවීමට වේලාව හරි...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: messageText });
                console.log(`✅ පණිවිඩය සාර්ථකව යැවුණා: ${jid}`);
            } catch (err) {
                console.error(`❌ පණිවිඩය යැවීමට නොහැකි වුණා: ${jid}`, err);
            }
        }
    }, {
        scheduled: true,
        timezone: "Asia/Colombo"
    });
}

// බොට් ක්‍රියාත්මක කරන්න
startBot().catch(err => console.log("Unexpected error: " + err));
