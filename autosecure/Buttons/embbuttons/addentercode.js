const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require("discord.js");
const presetsMessage = require("../../utils/presets/presetsMessage");
module.exports = {
    name: "addentercode",
    userOnly: true,
    callback: async (client, interaction) => {
        try {

            const name = interaction.customId.split("|")[1];
            const extra = interaction.customId.split("|")[2];
            

            const newExtraValue = extra === "0" ? "0" : "1";
            

            const msg = await presetsMessage(name, client, newExtraValue === "1");
            

            return interaction.update(msg);
        } catch (error) {
            console.error("Error updating code button status:", error);
            return interaction.update({
                content: "An error occurred while updating the preset.",
                ephemeral: true
            });
        }
    }
};