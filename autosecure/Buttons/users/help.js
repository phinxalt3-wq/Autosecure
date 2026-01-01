const { EmbedBuilder } = require('discord.js');
const config = require("../../../config.json")

module.exports = {
    name: `help`,
    editclaiming: true,
    async execute(client, interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('❓| Help')
            .addFields(
                {
                    name: 'Claiming',
                    value: 'Before changing claiming settings for your users, ensure claiming is enabled in /settings\nOnce claiming is enabled, your users can claim by using /claim {username}'
                },
                {
                    name: 'Claiming Modes',
                    value: `
                        **Full**: This will send the full account to the user who claimed the account.
                        **SSID**: This will send only the SSID to the user. They can use this to login but won't be able to change any details for the account.
                        **Disabled**: The user can't use the /claim command.
                    `
                },
                { 
                    name: 'Panel', 
                    value: 
                        'Use the panel to remove and add users by their user id. You can get this by right-clicking on their profile with Developer Options enabled (Discord Settings > App Settings > Advanced > Developer Mode)\n\n' +
                        'Use the navigation arrows to switch between the users you want to manage' 
                }
            )
            .setFooter({ text: config.footer1 })
            .setTimestamp(); // Added parentheses to call the method correctly

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
};
