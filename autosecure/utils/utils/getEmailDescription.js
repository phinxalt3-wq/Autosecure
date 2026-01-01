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

        const domain = secEmail.split("@")[1];
        if (checkdomain && ["hotmail.com", "gmail.com", "outlook.com"].includes(domain)) {
            console.log(`Unverified email from supported domain: ${domain}`);
            resolveOnce(null);
            return;
        }

        watchForEmail(secEmail, async (emailData) => {
            if (emailData.time > time) {
                if (getcode) {
                    const code = await extractCode(emailData.description);
                    resolveOnce(code);
                } else {
                    resolveOnce(emailData.description);
                }
            }
        });

        setTimeout(async () => {
            if (!hasResolved) {
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
                    } else {
                        resolveOnce(null);
                    }
                } catch (error) {
                    resolveOnce(null);
                }
            }
        }, 10000);
    });
}

module.exports = { getEmailDescription };
