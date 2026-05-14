const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');

const BOT_NUMBER = "94757255903"; 
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
    // 1. අනිවාර්යයෙන්ම පරණ auth_info_baileys folder එක delete කරන්න restart එකට කලින්
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
        // Browser setting එක වෙනස් කළා (මේක ගොඩක් වැදගත්)
        browser: ["Chrome (Linux)", "Chrome", "110.0.5481.177"], 
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered) {
        console.log("⏳ Connection එක හදනවා... තත්පර 10ක් ඉන්න...");
        setTimeout(async () => {
            try {
                // Request එක යවන්න කලින් පොඩි delay එකක් දීමෙන් block වීම වළක්වන්න පුළුවන්
                let code = await sock.requestPairingCode(BOT_NUMBER);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\n📢 ඔබේ කේතය (Pairing Code): ${code}\n\n`);
            } catch (err) {
                console.error("❌ Pairing error: ", err.message);
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
            console.log('✅ බොට් සාර්ථකව සම්බන්ධ වුණා! දැන් වැඩේ 100% ක් හරි.');
        }
    });

    cron.schedule('0 4,9,15,21 * * *', async () => {
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: messageText });
                console.log(`✅ Message Sent to: ${jid}`);
            } catch (err) {
                console.error(`❌ Send Error: ${jid}`);
            }
        }
    }, { scheduled: true, timezone: "Asia/Colombo" });
}

startBot();
