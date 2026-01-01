const { TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const modalBuilder = require('../../../autosecure/utils/modalBuilder');

module.exports = {
    name: "search",
    callback: async (client, interaction) => {
        const [t, userId] = interaction.customId.split("|");

        // Show the search modal
        interaction.showModal(modalBuilder(`searchmodal`, 'Search Accounts', [
            {
                setCustomId: 'searchQuery',
                setMaxLength: 256,
                setMinLength: 1,
                setRequired: true,
                setLabel: "Search Query",
                setPlaceholder: "Enter username, email, or other details",
                setStyle: TextInputStyle.Short
            }
        ]));
    }
};