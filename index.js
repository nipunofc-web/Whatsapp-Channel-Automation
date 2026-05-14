const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const cron = require('node-cron');
const pino = require('pino');

// යවන්න ඕන Message එක
const message = `*​🎭 MONEY HEIST OFC TEAM 🎭*
> *​// ᴀᴅᴍɪɴ ᴍʀ ɴɪᴘᴜɴ ᴏꜰᴄ*
*​⚡ [01] DEPLOY MINIBOT* 
* https://nipunofc.store/moneyheist

*⚙️ [02] CORE CONFIGURATION*
* https://nipunofc.store/minibot/setting

*​🔥 [03] MINING FREE COINS* 
* https://nipunofc.store/minibot/coin

*​💬 [04] NEURAL AUTO-REPLIES*
* https://nipunofc.store/minibot/autoreply

*​📧 [05] DATABASE CLOUD SYNC*
* https://nipunofc.store/minibot/contact
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴ ᴛᴇᴄʜ ᴏꜰᴄ™*`;

// ඔයාගේ Channel IDs ටික
const channelJids = [
    '120363398681287064@newsletter',
    '120363413193872888@newsletter'
];

// ඔයාගේ බොට්ගෙ නම්බර් එක මෙතන දෙන්න (Pairing code ගන්න)
const BOT_NUMBER = "94757255903"; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["N TECH OFC Auto-Bot", "Chrome", "1.0.0"],
    });

    // Pairing Code එක Generate කිරීම
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(BOT_NUMBER);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\n✅ WhatsApp එකට ලොග් වෙන්න මේ Pairing Code එක පාවිච්චි කරන්න: ${code}\n\n`);
            } catch (err) {
                console.log("Pairing code එක ගන්න බැරි වුණා:", err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('❌ Bot Logged out. auth_info_baileys folder එක delete කරලා ආයේ run කරන්න.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot Connected Successfully!');
        }
    });

    // ලංකාවේ වෙලාවෙන් (Asia/Colombo) - උදේ 4(4), උදේ 9(9), දවල් 3(15), රෑ 9(21)
    cron.schedule('0 4,9,15,21 * * *', async () => {
        console.log('🕒 වෙලාව හරි! Channels වලට massage එක යවනවා...');
        for (const jid of channelJids) {
            try {
                await sock.sendMessage(jid, { text: message });
                console.log(`✅ ${jid} එකට massage එක යැව්වා.`);
            } catch (err) {
                console.error(`❌ ${jid} එකට යවන්න බැරි වුණා:`, err);
            }
        }
    }, {
        scheduled: true,
        timezone: "Asia/Colombo"
    });
}

startBot();
