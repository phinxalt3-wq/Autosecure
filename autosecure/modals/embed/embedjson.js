module.exports = {
    name: "embedjson",
    callback: (client, interaction) => {
        try {
            let type = interaction.customId.split("|")[1];

            let embedJson = interaction.fields.getTextInputValue('json');
            let savedmessage = `Imported your ${type} embed! You can edit it if needed, then save.`
            

            let embedData = JSON.parse(embedJson);
            


            let embeds = embedData.embeds;
            

            interaction.update({
                content: savedmessage,
                embeds: embeds,
                attachments: []
            });
        } catch (error) {
            console.error("Error processing embed JSON:", error);

            interaction.reply({
                content: "Error processing the embed JSON. Please check your format and try again.",
                ephemeral: true
            });
        }
    }
};