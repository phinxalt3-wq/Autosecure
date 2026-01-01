const { TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const modalBuilder = require('../../utils/modalBuilder');
module.exports = {
    name: "addaccount",
    callback: async (client, interaction) => {
        const [t, userId] = interaction.customId.split("|");
       
        interaction.showModal(modalBuilder(`addaccountmodal|${userId}`, `Add New Account`, [
            {
                setCustomId: 'oldName',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: true,
                setLabel: "Username",
                setPlaceholder: "Enter account username",
                setStyle: TextInputStyle.Short
            },
            {
                setCustomId: 'password',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: true,
                setLabel: "Password",
                setPlaceholder: "Enter account password",
                setStyle: TextInputStyle.Short
            },
            {
                setCustomId: 'email',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: true,
                setLabel: "Email",
                setPlaceholder: "Format: primaryEmail,secondaryEmail (optional)",
                setStyle: TextInputStyle.Short
            },
            {
                setCustomId: 'secretkey',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: false,
                setLabel: "Secret Key",
                setPlaceholder: "Enter secret key (optional)",
                setStyle: TextInputStyle.Short
            },
            {
                setCustomId: 'recoveryCode',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: false,
                setLabel: "Recovery Code",
                setPlaceholder: "Enter recovery code (optional)",
                setStyle: TextInputStyle.Short
            }
        ]));
    }
};