const { queryParams } = require("../../../db/database")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "deletepreset",
    userOnly: true,
    callback: async (client, interaction) => {

        let type = interaction.customId.split("|")[1]
        

        let embed = null;
        embed = new EmbedBuilder().setTitle("Edit your preset using the buttons!");
        

        


        const currentComponents = interaction.message.components
        

        return interaction.update({
            content: `Cleared out your embed! Use /removepreset to delete existing presets!`,
            embeds: [embed], // Note: defaultEmbed returns a single embed object, not an array with embeds property
            components: currentComponents
        })
    }
}