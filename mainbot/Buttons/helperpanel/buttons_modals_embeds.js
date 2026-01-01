const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'responses',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('How do you edit the bot responses [Embeds, Buttons, Modals, Presets]')
      .setDescription(`Navigate to /bots and you will see the buttons to edit them!`)
      .setColor('#c6d2dd');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
