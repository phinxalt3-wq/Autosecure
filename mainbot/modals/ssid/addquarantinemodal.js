const { quarantinemsg } = require('../../../autosecure/utils/bancheckappeal/quarantinemsg');

module.exports = {
    name: "addtoquarantine",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const ssid = interaction.fields.getTextInputValue('quarantinessid');

            const msg = await quarantinemsg(interaction.user.id, ssid);

            await interaction.editReply(msg);
        } catch (error) {
            console.error('Quarantine Command Error:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('Quarantine Failed')
                        .setDescription('An unexpected error occurred')
                ]
            });
        }
    }
};
