const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "changetoken",
    editbot: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split('|')[1];
        let botnumber = interaction.customId.split('|')[2];

        const modal = new ModalBuilder()
            .setCustomId(`tokenmodal|${id}|${botnumber}`)
            .setTitle('Set Bot Activity');

        const tokeninput = new TextInputBuilder()
            .setCustomId('token')
            .setLabel('Enter new bot token to transfer bot to!')
            .setPlaceholder('Discord Developer > Bot > Reset Token then copy it.')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(4000)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(tokeninput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};
