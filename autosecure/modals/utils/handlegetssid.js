const { passwordAuth } = require('../../utils/info/passwordauth');
const generateotp = require('../../utils/secure/codefromsecret');
const HttpClient = require('../../utils/process/HttpClient');
const xbl = require('../../utils/minecraft/xbl');
const ssid = require('../../utils/minecraft/ssid');
const profile = require('../../utils/minecraft/profile');
const login = require('../../utils/secure/login');
const loginpass = require('../../utils/secure/loginpass')

module.exports = {
    name: "handlegetssid",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });
            const [_, method] = interaction.customId.split('|');
            const fields = interaction.fields;

            let sid;
            let skipXBL = false;
            const HttpClientfix = new HttpClient();

            switch (method) {
                case 'emailpass': {
                    const email = fields.getTextInputValue('email');
                    const password = fields.getTextInputValue('password');
                    let msauthToken = await loginpass(email, password);

                    if (!msauthToken) {
                        sid = await passwordAuth(email, password);
                        skipXBL = true;
                    } else {
                        HttpClientfix.setCookie(`__Host-MSAAUTH=${msauthToken}`);
                        let loginData = await HttpClientfix.post("https://login.live.com/login.srf");

                        if (loginData.data.includes("accrue") || loginData.data.includes("recover") ||
                            loginData.data.includes("Abuse") || loginData.data.includes("identity/confirm")) {
                            return interaction.editReply({
                                embeds: [{
                                    title: "Error :x:",
                                    description: "Account is locked!",
                                    color: 0xff0000
                                }],
                                ephemeral: true
                            });
                        } else if (loginData.data.includes("cancel")) {
                            sid = await passwordAuth(email, password);
                            skipXBL = true;
                        }
                    }

                    if (!skipXBL) {
                        const xb = await xbl(HttpClientfix);
                        sid = await ssid(xb.XBL);
                    }

                    if (["noxbox", "failed", "tfa", "bad", "unknown"].includes(sid)) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: `An error occurred: ${convertToken(sid)}`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'msauth': {
                    const msauthToken = fields.getTextInputValue('authcode');
                    HttpClientfix.setCookie(`__Host-MSAAUTH=${msauthToken}`);
                    const xb = await xbl(HttpClientfix);
                    sid = await ssid(xb.XBL);

                    if (["noxbox", "failed", "tfa", "bad", "unknown"].includes(sid)) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: `An error occurred: ${convertToken(sid)}`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }
                    break;
                }

                case 'tfa': {
                    const email = fields.getTextInputValue('email');
                    const password = fields.getTextInputValue('password');
                    const secretkey = fields.getTextInputValue('secretkey');

                    const { otp } = await generateotp(secretkey);
                    const msauthToken = await login({ otp, email, pw: password }, null);

                    if (!msauthToken) {
                        return interaction.editReply({
                            embeds: [{
                                title: `Error :x:`,
                                description: 'Failed to login with 2FA',
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    HttpClientfix.setCookie(`__Host-MSAAUTH=${msauthToken}`);
                    const xb = await xbl(HttpClientfix);
                    sid = await ssid(xb.XBL);

                    if (["noxbox", "failed", "tfa", "bad", "unknown"].includes(sid)) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: `An error occurred: ${convertToken(sid)}`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }
                    break;
                }

                default:
                    return interaction.editReply({
                        embeds: [{
                            title: `Error :x:`,
                            description: `Invalid method selected`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    });
            }

            if (!sid) {
                return interaction.editReply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Couldn't get the SSID (Maybe the user doesn't have Minecraft)`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                });
            }

            const userProfile = await profile(sid);
            if (!userProfile?.name || !userProfile?.uuid) {
                return interaction.editReply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Account doesn't have Minecraft or profile data is incomplete!`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                });
            }

            return interaction.editReply({
                embeds: [{
                    title: userProfile.name,
                    description: `\`\`\`${sid}\`\`\``,
                    color: 0xB8D2F0
                }],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in handlegetssid:', error);
            await interaction.editReply({
                embeds: [{
                    title: `Error :x:`,
                    description: `An error occurred.`,
                    color: 0xff0000
                }],
                ephemeral: true
            });
        }
    }
};

function convertToken(value) {
    const messages = {
        "noxbox": "No Xbox Profile!",
        "failed": "Failed (unknown reason)",
        "tfa": "2FA is enabled!",
        "bad": "Wrong Email/password!",
        "unknown": "Maybe TFA is enabled?"
    };
    return messages[value] || "Unknown error";
}
