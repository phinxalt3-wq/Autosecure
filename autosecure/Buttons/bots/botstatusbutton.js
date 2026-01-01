const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "botstatus",
    editbot: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split('|')[1];
        let botnumber = interaction.customId.split('|')[2];

        const modal = new ModalBuilder()
            .setCustomId(`botstatus_modal|${id}|${botnumber}`)
            .setTitle('Set Bot Status');

        const activity_visibility = new TextInputBuilder()
            .setCustomId('activity_visibility')
            .setLabel('Visibility')
            .setPlaceholder('Online, Idle, Dnd, Invisible')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(10)
            .setRequired(true);

        const activityTypeInput = new TextInputBuilder()
            .setCustomId('activity_type')
            .setLabel('Activity')
            .setPlaceholder('Streaming, Listening, Competing, Watching, Playing')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(10)
            .setRequired(false);

        const activityTextInput = new TextInputBuilder()
            .setCustomId('activity_text')
            .setLabel('Activity Text')
            .setPlaceholder('Set your activity text.')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(128)
            .setRequired(false);

        const firstActionRow = new ActionRowBuilder().addComponents(activity_visibility);
        const secondActionRow = new ActionRowBuilder().addComponents(activityTypeInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(activityTextInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        await interaction.showModal(modal);
    }
};
