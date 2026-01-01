const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'emails',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('How do you access a security email?')
      .setDescription(`With a license, you can always access emails on my domain!

**Available Email Commands:**
- \`/mail inbox\` (Show an email's inbox)
- \`/mail register\` (Register a unique email address, this reserves an email on my domain, just for you alone!)
- \`/mail list\` (View all your saved (notification added) & registered emails)`)
      .setColor('#c6d2dd');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};