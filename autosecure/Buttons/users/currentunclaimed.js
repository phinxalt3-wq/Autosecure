const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "currentunclaimed",
    userOnly: true,
    callback: async (client, interaction) => {
        const modal = new ModalBuilder()
            .setCustomId('currentunclaimed')
            .setTitle('Switch to page');

        const input = new TextInputBuilder()
            .setCustomId('page')
            .setLabel('Choose a page')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);

        modal.addComponents(row);

        return interaction.showModal(modal);
    }
};
