const modalBuilder = require('../../utils/modalBuilder');
const { TextInputStyle } = require('discord.js');

module.exports = {
    name: "unclaimed_current",
    callback: async (client, interaction) => {
        interaction.showModal(modalBuilder(`unclaimedmodal`, `Navigate to a different page.`, [
            {
                setCustomId: 'page',
                setMaxLength: 6,
                setMinLength: 1,
                setRequired: true,
                setLabel: "Page Number",
                setPlaceholder: "Enter the page number!",
                setStyle: TextInputStyle.Short
            }
        ]));
    }
};
