const { ModalSubmitInteraction } = require('discord.js'); 
const { queryParams } = require("../../../db/database")

module.exports = {
    name: "proxyinput",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
                const proxy = interaction.fields.getTextInputValue('proxy_input').trim();

                // Simple validation: check for exactly three colons in the format host:port:user:pass
                const parts = proxy.split(':');
                if (parts.length !== 4) {
                    return await interaction.reply({
                        content: '❌ Invalid format! Must contain exactly three colons (host:port:user:pass)',
                        ephemeral: true
                    });
                }

                // Insert into database
                try {
                    const query = 'UPDATE controlbot SET proxy = ? WHERE id = 1';
                    await queryParams(query, [proxy]);
                    await interaction.reply({
                        content: '✅ Proxy successfully saved!',
                        ephemeral: true
                    });
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    await interaction.reply({
                        content: '❌ Failed to save proxy to the database',
                        ephemeral: true
                    });
                }
        } catch (error) {
            console.error('Error handling proxy input:', error);
            await interaction.reply({
                content: '❌ Something went wrong while processing your proxy input.',
                ephemeral: true
            });
        }
    }
};
