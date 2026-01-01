const axios = require("axios")
const { ApplicationCommandOptionType } = require("discord.js")
const checkIfUserIsOnline = require("../../../autosecure/utils/secure/onlinestatus")

module.exports = {
  name: "status",
  description: "Check Hypixel status",
  enabled: true,
  options: [
    {
      name: "username",
      description: "Username or UUID to check online status for",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  userOnly: true,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const input = interaction.options.getString("username")

    function isUUID(str) {
      return /^[0-9a-f]{32}$/i.test(str.replace(/-/g, ""))
    }

    async function getUUID(username) {
      try {
        const res = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        return res.data?.id || null
      } catch {
        return null
      }
    }

    async function getUsernameFromUUID(uuid) {
      try {
        const res = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
        return res.data?.name || null
      } catch {
        return null
      }
    }

    let uuid = input
    let name = input

    if (!isUUID(input)) {
      const convertedUUID = await getUUID(input)
      if (!convertedUUID) {
        await interaction.editReply({ 
          embeds: [{
            color: 0xff4757,
            title: '❌ Invalid Username',
            description: `Couldn't fetch UUID for \`${input}\`.`,
            thumbnail: {
              url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
            },
            fields: [{
              name: '💡 What to do?',
              value: '• Make sure the username is correct\n• Check for typos in the username\n• The player might not exist',
              inline: false
            }],
            footer: {
              text: 'Hypixel Status • Autosecure'
            },
            timestamp: new Date().toISOString()
          }]
        })
        return
      }
      uuid = convertedUUID
    } else {
      const resolvedName = await getUsernameFromUUID(input)
      if (resolvedName) name = resolvedName
    }

    const status = await checkIfUserIsOnline(uuid)

    if (!status) {
      await interaction.editReply({ 
        embeds: [{
          color: 0xffa502,
          title: '⚠️ Status Check Failed',
          description: `Couldn't fetch status for \`${name}\`.`,
          thumbnail: {
            url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
          },
          fields: [{
            name: '💡 What to do?',
            value: '• The player might be offline\n• Try again in a few moments\n• Check if the username/UUID is correct',
            inline: false
          }],
          footer: {
            text: 'Hypixel Status • Autosecure'
          },
          timestamp: new Date().toISOString()
        }]
      })
      return
    }

    await interaction.editReply({
      embeds: [{
        color: status.online ? 0x2ed573 : 0x747d8c,
        title: '🎮 Hypixel Status',
        description: `**${name}**'s current status`,
        thumbnail: {
          url: `https://visage.surgeplay.com/bust/${name}.png?y=-40`
        },
        fields: [{
          name: '📊 Status',
          value: status.online ? '🟢 **Online**' : '🔴 **Offline**',
          inline: true
        }, {
          name: '🎯 Game',
          value: status.online ? `\`${status.game || "Unknown"}\`` : 'N/A',
          inline: true
        }],
        footer: {
          text: 'Hypixel Status • Autosecure'
        },
        timestamp: new Date().toISOString()
      }]
    })
    
    } catch (error) {
      console.error('Error in status command:', error);
      try {
        await interaction.editReply({
          embeds: [{
            color: 0xff4757,
            title: '❌ Status Check Error',
            description: 'An error occurred while checking the player status.',
            thumbnail: {
              url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
            },
            fields: [{
              name: '🔧 Error Details',
              value: `\`${error.message}\``,
              inline: false
            }, {
              name: '💡 What to do?',
              value: '• Try again in a few moments\n• Contact support if the issue persists\n• Make sure the username/UUID is correct',
              inline: false
            }],
            footer: {
              text: 'Hypixel Status • Autosecure'
            },
            timestamp: new Date().toISOString()
          }]
        });
      } catch (replyError) {
        console.error('Error sending error message:', replyError);
      }
    }
  }
}
