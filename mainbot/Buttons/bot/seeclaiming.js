const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "seeclaiming",
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .addFields([
                {
                    name: 'Claiming (some things are in the making)',
                    value: `* \`/set\` -> logs, hits, notifications, users.\n` +
                           `* \`/users\` -> Add users & set permissions and claiming mode (SSID, Full, Nothing)\n` +
                           `**Claim Splits:**\n` +
                           `  * 1/1 Mode means claim splits are disabled; user always gets what is selected at claiming type\n` +
                           `  * Rest Split: The result they get when not reaching their split\n` +
                           `  * Claiming Split: The result they get when they reach their split\n` +
                           `  * After claim:\n` +
                           `    * If user gets Nothing/SSID, owner gets full account via DM and it's marked as claimed in \`/accounts\`\n` +
                           `  * Unclaimed accounts:\n` +
                           `    * Owner can add a delay to auto-claim after user didn't claim in time.\n` +
                           `    * Unclaimed accounts can be viewed in the \`/claim accounts\` panel`
                }
            ])
            .setColor(0xADD8E6);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
