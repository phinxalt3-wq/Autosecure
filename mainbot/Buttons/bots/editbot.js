const { editbotmsg } = require('../../../autosecure/utils/responses/editbotmessage');

module.exports = {
    name: "editbot",
    editbot: true,
    callback: async (client, interaction) => {
        try {
            const [_, botnumber, ownerid, hidebutton] = interaction.customId.split("|");
            const hideButtonBool = hidebutton === "1"; 

            const msg = await editbotmsg(client, interaction, botnumber, ownerid, hideButtonBool);
            return interaction.reply(msg);
        } catch (error) {
            console.error("Error in editbot command:", error);
            await interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true
            });
        }
    }
};
