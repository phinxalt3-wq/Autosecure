const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'configbutton',
  description: 'Information on how to use config',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('Config')
      .setDescription(
        `Don't share your config with anyone. They can login to your bot and possibly access all of your accounts.
        A config should only be used to save your personal settings. When your license expires you'll get the latest version of your config sent to you.
        

        
        **Available config commands:**
        \`/config show\` - Gives a file of current config (don't share)
        \`/config load\` - Load a config file (has to be valid)`

      )
      .setColor('#c6d2dd');

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  },
};