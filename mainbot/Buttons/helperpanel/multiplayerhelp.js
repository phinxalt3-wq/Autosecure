const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'multiplayerhelp',
  description: 'Information on how to fix multiplayer issues',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('Common Problem: Why does it say "Login: Null" or something similar when trying to join a server?')
      .setDescription(
        'Multiplayer is disabled in your Xbox settings.\n\n' +
        'Go to [this link](https://zyger.net/multiplayer); it will take you to the correct Xbox settings page. ' +
        'You may be prompted to sign in first; if so, complete the login, then revisit the link.\n\n' +
        'On the Xbox settings page, enable multiplayer under:\n' +
        '**Privacy & Online Safety → Xbox and Windows 10 Online Safety → "You can join multiplayer games"** (second last option).'
      )
      .addFields({
        name: 'Video Guide',
        value: `Watch using the link sent below (credit netherportal). It uses a different way to access the Privacy Settings. If it doesn't load, download it to watch it`
      })
      .setColor('#c6d2dd')
      .setFooter({ text: 'Some of these guides are outdated, use /bots and navigate to learn how the bot works' });

    // Send the initial embed
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    
    // Follow up with the video link
    await interaction.followUp({
      content: 'https://cdn.discordapp.com/attachments/1385410809508790313/1385507399615643708/20250620-0630-26.2001635.mp4?ex=68867091&is=68851f11&hm=ed86f6b0a1378d90e1fa0dc23005ef733ae8a0830c96d5fd0464a59517decc43',
      ephemeral: true
    });
  },
};