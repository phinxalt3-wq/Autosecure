const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'securing',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('How do you secure?')
      .setDescription('Run the command /secure, select which method (out of the 6) you wish to use to secure with and then submit.\n\nIf you wish to customize the securing process, use /secure Configuration')
      .setColor('#c6d2dd');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
