const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'login_msauth',
  description: 'Guide on how to login using the MSAAUTH cookie.',
  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('Login with MSAAUTH Cookie')
      .setDescription(
        `1. Navigate to https://login.live.com
2. Press \`Control + Shift + I\` and open Console in your Browser
3. Paste this code:
\`\`\`javascript
let cookie = "place_the_cookie_here";
document.cookie = "__Host-MSAAUTH=" + cookie + "; secure=true; path=/;";
\`\`\`
4. Replace \`place_the_cookie_here\` with your actual MSAUTH cookie value`
      )
      .setColor('#c6d2dd');

    const button = new ButtonBuilder()
      .setCustomId('video_guide')
      .setLabel('Video Guide (other method)')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  },
};