const { handlefeatures } = require("../../../autosecure/Handlers/buttons/buttonhandlerautosec");

module.exports = {
    name: "changeautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        
        try {
            let [t, botnumber, ownerid] = interaction.customId.split("|");
            await handlefeatures(interaction, ownerid, botnumber);
        } catch (err) {
            console.error("Error in changeautosecure:", err);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "❌ An error occurred while processing your request.",
                    ephemeral: true
                });
            }
        }
    }
};