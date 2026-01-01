const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const generate = require('../utils/generate');
const { queryParams } = require('../../../db/database');
const getProfile = require("./profile");

module.exports = async function ssidcheckermsg(ssid) {
  const decodeJwtPayload = (token) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch (error) {
      return null;
    }
  };

  const payload = decodeJwtPayload(ssid);
  if (!payload || !payload.exp) {
    return { 
      embeds: [{
        color: 0xff4757,
        title: '❌ Invalid SSID',
        description: 'The provided SSID is invalid or malformed.',
        thumbnail: {
          url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
        },
        fields: [{
          name: '💡 What to do?',
          value: '• Make sure the SSID is correct\n• Check if the SSID is still valid\n• Try generating a new SSID',
          inline: false
        }],
        footer: {
          text: 'SSID Checker • Autosecure'
        },
        timestamp: new Date().toISOString()
      }],
      ephemeral: true 
    };
  }

  const expirationTime = new Date(payload.exp * 1000);
  const formattedExpTime = `<t:${Math.floor(expirationTime.getTime() / 1000)}:R>`;

  try {
   // await getProfile(ssid)
    let profile = await axios({
      method: "GET",
      url: "https://api.minecraftservices.com/minecraft/profile",
      headers: {
        Authorization: `Bearer ${ssid}`
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (profile?.data?.name) {
      let { data: attributes } = await axios({
        method: "GET",
        url: "https://api.minecraftservices.com/player/attributes",
        headers: {
          Authorization: `Bearer ${ssid}`
        }
      });

      let { data: nameChangeInfo } = await axios({
        method: "GET",
        url: "https://api.minecraftservices.com/minecraft/profile/namechange",
        headers: {
          Authorization: `Bearer ${ssid}`
        }
      });

      let nameChangeId = generate(32);
      let skinChangeId = generate(32);
      let creationDateId = generate(32);

      queryParams(`INSERT INTO actions (id,action) VALUES (?,?)`, [nameChangeId, `namechange|${ssid}`]);
      queryParams(`INSERT INTO actions (id,action) VALUES (?,?)`, [skinChangeId, `changeskin|${ssid}`]);
      queryParams(`INSERT INTO actions (id,action) VALUES (?,?)`, [creationDateId, `creationdate|${nameChangeInfo.createdAt}`]);

      const capeNames = profile?.data?.capes?.map(cape => cape.alias).join(', ') || 'None';

      const fields = [
        {
          name: '👤 Username',
          value: `\`${profile.data.name}\``,
          inline: true
        },
        {
          name: '🔄 Name Change',
          value: nameChangeInfo.nameChangeAllowed ? '✅ **Available**' : '❌ **Not Available**',
          inline: true
        },
        {
          name: '⏰ Expires',
          value: formattedExpTime,
          inline: true
        },
        {
          name: '🎭 Capes',
          value: `\`${capeNames}\``,
          inline: true
        },
        {
          name: '🎮 Multiplayer',
          value: attributes?.privileges?.multiplayerServer?.enabled ? '✅ **Enabled**' : '❌ **Disabled**',
          inline: true
        }
      ];

      return {
        content: '',
        embeds: [{
          color: 0x2f3542,
          title: '🔍 SSID Information',
          description: `**${profile.data.name}**'s SSID details`,
          fields: fields,
          thumbnail: {
            url: `https://visage.surgeplay.com/bust/${profile.data.name}.png?y=-40&quality=lossless`
          },
          footer: {
            text: 'SSID Checker • Autosecure'
          },
          timestamp: new Date().toISOString(),
          type: 'rich'
        }],
        components: [
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder().setCustomId("action|" + nameChangeId).setLabel("Change name").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("action|" + skinChangeId).setLabel("Change skin").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("action|" + creationDateId).setLabel("Creation Date").setStyle(ButtonStyle.Secondary)
            )
        ],
        ephemeral: true
      };
    } else {
      return { 
        embeds: [{
          color: 0xff4757,
          title: '❌ Invalid SSID',
          description: 'The SSID is valid but no profile data was found.',
          thumbnail: {
            url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
          },
          fields: [{
            name: '💡 What to do?',
            value: '• Make sure the SSID is correct\n• Check if the SSID is still valid\n• Try generating a new SSID',
            inline: false
          }],
          footer: {
            text: 'SSID Checker • Autosecure'
          },
          timestamp: new Date().toISOString()
        }],
        ephemeral: true 
      };
    }
  } catch (error) {
    console.error(error);
    return { 
      embeds: [{
        color: 0xff4757,
        title: '❌ SSID Check Error',
        description: `An error occurred while checking your SSID.`,
        thumbnail: {
          url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
        },
        fields: [{
          name: '🔧 Error Details',
          value: `\`${error.message}\``,
          inline: false
        }, {
          name: '💡 What to do?',
          value: '• Make sure the SSID is valid\n• Try generating a new SSID\n• Contact support if the issue persists',
          inline: false
        }],
        footer: {
          text: 'SSID Checker • Autosecure'
        },
        timestamp: new Date().toISOString()
      }],
      ephemeral: true 
    };
  }
};
