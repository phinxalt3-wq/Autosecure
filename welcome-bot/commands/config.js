const { SlashCommandBuilder } = require('discord.js');
const settingsStore = require('../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or change guild welcome settings')
    .addSubcommand(sub =>
      sub.setName('show').setDescription('Show current settings'))
    .addSubcommand(sub =>
      sub.setName('set').setDescription('Set a config value')
        .addStringOption(o => o.setName('key').setDescription('Key').setRequired(true).addChoices(
          { name: 'welcomechannel', value: 'welcomechannel' },
          { name: 'leavechannel', value: 'leavechannel' },
          { name: 'memberrole', value: 'memberrole' },
          { name: 'buychannels', value: 'buychannels' },
          { name: 'welcome_enabled', value: 'welcome_enabled' },
          { name: 'leave_enabled', value: 'leave_enabled' }
        ))
        .addStringOption(o => o.setName('value').setDescription('Value').setRequired(true)))
    .addSubcommand(sub => sub.setName('test').setDescription('Test welcome/leave messages').addStringOption(o => o.setName('which').setDescription('welcome or leave').setRequired(true).addChoices({ name: 'welcome', value: 'welcome' }, { name: 'leave', value: 'leave' }))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'show') {
      const s = await settingsStore.getSettings(guildId);
      return interaction.reply({ ephemeral: true, content: `Welcome: ${s.welcomechannel}\nLeave: ${s.leavechannel}\nMember role: ${s.memberrole}\nBuy channels: ${s.buychannels}\nWelcome enabled: ${s.welcome_enabled}\nLeave enabled: ${s.leave_enabled}` });
    }

    if (sub === 'set') {
      const key = interaction.options.getString('key');
      let value = interaction.options.getString('value');
      // normalize booleans
      if (['welcome_enabled','leave_enabled'].includes(key)) {
        value = ['1','true','yes','on'].includes(value.toLowerCase()) ? 1 : 0;
      }
      await settingsStore.setSetting(guildId, key, value);
      return interaction.reply({ ephemeral: true, content: `Set ${key} -> ${value}` });
    }

    if (sub === 'test') {
      const which = interaction.options.getString('which');
      if (which === 'welcome') {
        await interaction.reply({ ephemeral: true, content: 'Sending a welcome test to configured channel...' });
        const s = await settingsStore.getSettings(guildId);
        if (!s.welcomechannel) return interaction.followUp({ ephemeral: true, content: 'No welcome channel set.' });
        const channel = interaction.guild.channels.cache.get(s.welcomechannel);
        if (!channel) return interaction.followUp({ ephemeral: true, content: 'Configured channel not found.' });
        const embed = { title: `Welcome Test`, description: `This is a test welcome for ${interaction.user}` };
        await channel.send({ embeds: [embed] });
        return interaction.followUp({ ephemeral: true, content: 'Test sent.' });
      } else {
        await interaction.reply({ ephemeral: true, content: 'Sending a leave test to configured channel...' });
        const s = await settingsStore.getSettings(guildId);
        if (!s.leavechannel) return interaction.followUp({ ephemeral: true, content: 'No leave channel set.' });
        const channel = interaction.guild.channels.cache.get(s.leavechannel);
        if (!channel) return interaction.followUp({ ephemeral: true, content: 'Configured channel not found.' });
        const embed = { title: `Leave Test`, description: `This is a test leave for ${interaction.user}` };
        await channel.send({ embeds: [embed] });
        return interaction.followUp({ ephemeral: true, content: 'Test sent.' });
      }
    }
  }
};