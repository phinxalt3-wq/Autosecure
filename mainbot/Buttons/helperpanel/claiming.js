const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'seeclaiming2',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('How to use claiming and manage users?')
      .setDescription(`You can enable claiming in /settings. This can only be done by an admin or the owner. After enabling claiming, add users to the /users panel and manage them by assigning them:

**Claiming Modes:**
• Full: Users will get the full account after claiming and can make it theirs.
• SSID: Users will only get the SSID (that lasts 24 hours) after claiming.
• Disabled: Claiming is turned off; no new accounts can be claimed.

**Configure permissions**
Use the selector to change the settings for a user and click enter once you've selected all the permissions your user should get!

**Configure auto-split**
Split Example:
Claiming Type: Full
Split: 1/3
Rest Split: SSID
This means 1 of the 3 accounts the user claims, they will get the full account for. The rest of the accounts (2/3) will give them what is selected at the rest, either nothing or the SSID, in this case SSID. This is all done automatically and shouldn't be worried about.`)
      .setColor('#c6d2dd');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};