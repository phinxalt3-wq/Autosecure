const { PermissionsBitField, TextInputStyle } = require('discord.js');
const modalBuilder = require('../../../autosecure/utils/modalBuilder');

module.exports = {
    name: "addtoticket",
    ownerOnly: true,
    callback: async (client, interaction) => {
        try {
            await interaction.showModal(modalBuilder(`addtoticketmodal`, `Add User`, [
                {
                    setCustomId: 'userid',
                    setMaxLength: 256,
                    setMinLength: 0,
                    setRequired: true,
                    setLabel: "Discord User",
                    setPlaceholder: "Enter a user id",
                    setStyle: TextInputStyle.Short
                }
            ]));
        } catch (error) {
            console.error("AddToTicket Error:", error);
            await interaction.reply({ 
                content: "❌ Failed to open modal.", 
                ephemeral: true 
            });
        }
    }
};
