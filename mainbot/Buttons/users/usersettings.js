const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../../autosecure/utils/utils/modalBuilder");
const { handlechangeusers } = require("../../../autosecure/Handlers/buttons/buttonhandlerautosec");

module.exports = {
    name: "usersettings",
    editclaiming: true,
    callback: async (client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        const [action, ...params] = interaction.customId.split("|");
        const selectedValues = interaction.values; 

        await handlechangeusers(client, interaction, params, selectedValues);
    },
};
