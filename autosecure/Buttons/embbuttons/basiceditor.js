const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "basiceditor",
    editembeds: true,
    callback: async (client, interaction) => {
        let type = interaction.customId.split("|")[1];
        let botnumber = interaction.customId.split("|")[2];
        let userid = interaction.customId.split("|")[3];

        // Create basic editing buttons with your specified layout
        const title = new ButtonBuilder().setCustomId("title").setLabel("Title").setStyle(ButtonStyle.Primary);
        const description = new ButtonBuilder().setCustomId("description").setLabel("Description").setStyle(ButtonStyle.Primary);
        const authorName = new ButtonBuilder().setCustomId("author").setLabel("Author name").setStyle(ButtonStyle.Primary);
        const authorUrl = new ButtonBuilder().setCustomId("authorurl").setLabel("Author Url").setStyle(ButtonStyle.Primary);
        const thumbnailUrl = new ButtonBuilder().setCustomId("thumbnail").setLabel("Thumbnail URL").setStyle(ButtonStyle.Primary);
        
        const imageUrl = new ButtonBuilder().setCustomId("image").setLabel("Image Url").setStyle(ButtonStyle.Primary);
        const footerText = new ButtonBuilder().setCustomId("footer").setLabel("Footer Text").setStyle(ButtonStyle.Primary);
        const footerUrl = new ButtonBuilder().setCustomId("footerurl").setLabel("Footer URL").setStyle(ButtonStyle.Primary);
        const color = new ButtonBuilder().setCustomId("color").setLabel("Color").setStyle(ButtonStyle.Primary);
        const addField = new ButtonBuilder().setCustomId("addfield").setLabel("Add Field").setStyle(ButtonStyle.Primary);
        
        const removeField = new ButtonBuilder().setCustomId("removefield").setLabel("Remove Field").setStyle(ButtonStyle.Primary);
        const saveEmbed = new ButtonBuilder().setCustomId(`saveembed|${type}|${botnumber}|${userid}`).setLabel("Save Embed").setStyle(ButtonStyle.Success);
        const resetEmbed = new ButtonBuilder().setCustomId(`resetembed|${type}|${botnumber}|${userid}`).setLabel("Reset Embed").setStyle(ButtonStyle.Danger);
        const back = new ButtonBuilder().setCustomId(`backtoembed|${type}|${botnumber}|${userid}`).setLabel("Back").setStyle(ButtonStyle.Secondary);

        // Keep the existing embed but update the buttons
        let currentEmbed = interaction.message.embeds[0];
        
        return interaction.update({
            embeds: [currentEmbed],
            components: [
                new ActionRowBuilder().addComponents(title, description, authorName, authorUrl, thumbnailUrl),
                new ActionRowBuilder().addComponents(imageUrl, footerText, footerUrl, color, addField),
                new ActionRowBuilder().addComponents(removeField, saveEmbed, resetEmbed, back)
            ]
        });
    }
};
