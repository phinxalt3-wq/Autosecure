const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    name: "addprofile",
    callback: async (client, interaction) => {
        const loadEmbed = new ButtonBuilder().setCustomId("loadembed").setLabel("Load Embed").setStyle(ButtonStyle.Primary)
        const saveEmbed = new ButtonBuilder().setCustomId("saveprofile").setLabel("Save Embed").setStyle(ButtonStyle.Success)
        const resetEmbed = new ButtonBuilder().setCustomId("resetembed").setLabel("Reset Embed").setStyle(ButtonStyle.Danger)
        const exportEmbed = new ButtonBuilder().setCustomId("exportembed").setLabel("Export Embed").setStyle(ButtonStyle.Secondary)
        const placeholders = new ButtonBuilder().setCustomId("placeholders").setLabel("Placeholders").setStyle(ButtonStyle.Secondary)
        const basicEditor = new ButtonBuilder().setCustomId("basiceditor").setLabel("Basic Editor").setStyle(ButtonStyle.Secondary)
        return interaction.reply({
            embeds: [{ title: `Embed to be sent`, description: `Change the embed using these buttons\n And once you are done, click on the send button!`, color: 0x00ff00 }],
            components: [
                new ActionRowBuilder().addComponents(loadEmbed, saveEmbed, resetEmbed, exportEmbed, placeholders),
                new ActionRowBuilder().addComponents(basicEditor)
            ],
            ephemeral: true
        })
    }
}