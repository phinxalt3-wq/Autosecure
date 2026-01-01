const { queryParams } = require("../../../db/database");
const { watchForEmail } = require("../../../mainbot/handlers/emailHandler");
const { extractCode } = require("./extractCode");

async function getEmailDescription(time, secEmail, getcode = false, checkdomain = false) {
    return new Promise((resolve) => {
        let hasResolved = false;

        const resolveOnce = (value) => {
            if (!hasResolved) {
                hasResolved = true;
                resolve(value);
            }
        };

        if (!secEmail || typeof secEmail !== 'string' || !secEmail.includes('@')) {
            console.log(`Invalid security email provided: ${secEmail}`);
            resolveOnce(null);
            return;
        }

        watchForEmail(secEmail, async (emailData) => {
            if (emailData.time > time) {
                const body = emailData.text;
                if (getcode) {
                    const code = await extractCode(body);
                    resolveOnce(code);
                } else {
                    resolveOnce(body);
                }
            }
        });

        // Check every second for 10 seconds total
        let checkCount = 0;
        const maxChecks = 10; // 10 seconds total
        
        const checkInterval = setInterval(async () => {
            if (hasResolved) {
                clearInterval(checkInterval);
                return;
            }
            
            checkCount++;
            
            try {
                const results = await queryParams(
                    `SELECT description, time FROM emails 
                     WHERE receiver = ? AND time > ? 
                     ORDER BY time DESC LIMIT 1`,
                    [secEmail, time]
                );

                if (results && results.length > 0) {
                    const description = results[0].description;
                    if (getcode) {
                        const code = await extractCode(description);
                        resolveOnce(code);
                    } else {
                        resolveOnce(description);
                    }
                    clearInterval(checkInterval);
                } else if (checkCount >= maxChecks) {
                    // Timeout after 10 seconds
                    resolveOnce(null);
                    clearInterval(checkInterval);
                }
            } catch (error) {
                if (checkCount >= maxChecks) {
                    resolveOnce(null);
                    clearInterval(checkInterval);
                }
            }
        }, 1000); // Check every 1 second
    });
}

module.exports = { getEmailDescription };