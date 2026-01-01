const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Shows basic info about this bot'),
  async execute(interaction) {
    return interaction.reply({ ephemeral: true, content: `Welcome Bot - features: welcome, leave, config commands.` });
  }
};