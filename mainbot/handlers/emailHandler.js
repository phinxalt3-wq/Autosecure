const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { queryParams } = require("../../db/database");
const embedWrapper = require("../utils/emails/embedWrapper");
const { ignoreEmails } = require("../../config.json");
const EventEmitter = require('events');
const config = require('../../config.json');

// --- Config ---
const SMTP_PORT = 25;
const SMTP_HOST = config.smtpHost || '0.0.0.0'; // Listen on all interfaces
const emailWatchers = new Map();
let client = null; // Discord client (set via initialize)

// --- SMTP Server Setup ---
const smtpServer = new SMTPServer({
    logger: true, // Enable logging
    disabledCommands: ['AUTH'], // Disable authentication (if not needed)
    onData(stream, session, callback) {
        simpleParser(stream)
            .then(parsed => processIncomingEmail(parsed))
            .then(() => callback())
            .catch(err => {
                console.error('Error processing email:', err);
                callback(err);
            });
    },
    onConnect(session, callback) {
        console.log(`New SMTP connection from ${session.remoteAddress}`);
        callback(); // Accept the connection
    },
});

// --- Functions ---
function initialize(discordClient) {
    client = discordClient;
    console.log('?? Email handler initialized with Discord client');
    startSMTPServer();
}

function startSMTPServer() {
    smtpServer.listen(SMTP_PORT, SMTP_HOST, () => {
        console.log(`? SMTP server running on ${SMTP_HOST}:${SMTP_PORT}`);
    });

    smtpServer.on('error', (err) => {
        console.error('? SMTP server error:', err.message);
        setTimeout(startSMTPServer, 5000); // Reconnect after 5s
    });
}

async function processIncomingEmail(parsed) {
    const { from, to, subject, text, date } = parsed;
    const recipient = to?.value?.[0]?.address || "unknown@unknown";
    const sender = from?.value?.[0]?.address || "unknown@unknown";

    if (ignoreEmails.includes(sender)) {
        console.log(`?? Ignoring email from ${sender} (in ignore list)`);
        return;
    }

    const code = extractVerificationCode(text || "");
    console.log(`?? New email: ${sender} ? ${recipient}${code ? ` (code: ${code})` : ''}`);

    // Notify watchers (if any)
    if (emailWatchers.has(recipient)) {
        emailWatchers.get(recipient)({
            text,
            time: date || Date.now(),
        });
    }

    // Store in DB
    await storeEmail(recipient, sender, subject || "(no subject)", text || "", date || Date.now());

    // Send Discord notifications (if client is available)
    if (client) {
        await sendNotifications(recipient, parsed);
    }
}

function extractVerificationCode(text) {
    const codeMatch = text.match(/\b\d{6,7}\b/); // Match 6-7 digit codes
    return codeMatch ? codeMatch[0] : null;
}

async function storeEmail(email, from, subject, text, time) {
    try {
        console.log(`[DEBUG] Storing email: receiver=${email}, sender=${from}, time=${time} (type: ${typeof time})`);
        await queryParams(
            `INSERT INTO emails(receiver, sender, subject, description, time) VALUES(?, ?, ?, ?, ?)`,
            [email, from, subject, text, time]
        );
        console.log(`[DEBUG] Email stored successfully for ${email}`);
        
        // Verify it was stored by immediately querying it back
        const verification = await queryParams(
            `SELECT * FROM emails WHERE receiver=? ORDER BY time DESC LIMIT 1`,
            [email]
        );
        console.log(`[DEBUG] Verification query found ${verification.length} emails for ${email}`);
        if (verification.length > 0) {
            console.log(`[DEBUG] Most recent email:`, verification[0]);
        }
    } catch (err) {
        console.error('Failed to store email:', err);
    }
}

async function sendNotifications(email, parsed) {
    try {
        const subscribers = await queryParams(
            `SELECT user_id FROM email_notifier WHERE email = ?`,
            [email]
        );

        if (!subscribers?.length) return;

        for (const sub of subscribers) {
            try {
                const discordUser = await client.users.fetch(sub.user_id);
                if (discordUser) {
                    await discordUser.send({
                        content: `?? New email to **${email}**`,
                        embeds: [embedWrapper(parsed.subject || "(no subject)", parsed.text || "")],
                    });
                }
            } catch (err) {
                console.error(`Failed to DM user ${sub.user_id}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Error sending notifications:', err);
    }
}

function watchForEmail(email, callback, timeout = 30000) {
    emailWatchers.set(email, callback);
    setTimeout(() => emailWatchers.delete(email), timeout);
}

function shutdown() {
    console.log('?? Shutting down SMTP server...');
    smtpServer.close();
}

module.exports = {
    initialize,
    watchForEmail,
    storeEmail,
    sendNotifications,
    shutdown,
};
