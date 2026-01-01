module.exports = {
    name: "exportembed",
    editembeds: true,
    callback: async (client, interaction) => {
        let embed = interaction.message.embeds[0].data;
        let type = interaction.customId.split("|")[1];
        
        // Create clean JSON export
        let exportData = {
            embeds: [embed]
        };
        
        let jsonString = JSON.stringify(exportData, null, 2);
        
        // Create a text file attachment
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(Buffer.from(jsonString), {
            name: `${type}_embed.json`
        });

        return interaction.reply({
            content: `Here's your ${type} embed as JSON:`,
            files: [attachment],
            ephemeral: true
        });
    }
};