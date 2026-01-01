const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "backtoembed",
    editembeds: true,
    callback: async (client, interaction) => {
        let type = interaction.customId.split("|")[1];
        let botnumber = interaction.customId.split("|")[2];
        let userid = interaction.customId.split("|")[3];

        // Create the new format buttons
        const loadEmbed = new ButtonBuilder().setCustomId(`loadembed|${type}|${botnumber}|${userid}`).setLabel("Load Embed").setStyle(ButtonStyle.Primary);
        const saveEmbed = new ButtonBuilder().setCustomId(`saveembed|${type}|${botnumber}|${userid}`).setLabel("Save Embed").setStyle(ButtonStyle.Success);
        const resetEmbed = new ButtonBuilder().setCustomId(`resetembed|${type}|${botnumber}|${userid}`).setLabel("Reset Embed").setStyle(ButtonStyle.Danger);
        const exportEmbed = new ButtonBuilder().setCustomId(`exportembed|${type}|${botnumber}|${userid}`).setLabel("Export Embed").setStyle(ButtonStyle.Secondary);
        const placeholders = new ButtonBuilder().setCustomId(`placeholders|${type}`).setLabel("Placeholders").setStyle(ButtonStyle.Secondary);
        const basicEditor = new ButtonBuilder().setCustomId(`basiceditor|${type}|${botnumber}|${userid}`).setLabel("Basic Editor").setStyle(ButtonStyle.Secondary);

        // Keep the existing embed but update the buttons back to new format
        let currentEmbed = interaction.message.embeds[0];
        
        return interaction.update({
            embeds: [currentEmbed],
            components: [
                new ActionRowBuilder().addComponents(loadEmbed, saveEmbed, resetEmbed, exportEmbed, placeholders),
                new ActionRowBuilder().addComponents(basicEditor)
            ]
        });
    }
};
