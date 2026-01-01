const axios = require("axios")
const { ApplicationCommandOptionType } = require("discord.js")
const checkIfUserIsOnline = require('../../utils/secure/onlinestatus')

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
        await interaction.reply({ content: `Couldn't fetch UUID for \`${input}\`.`, ephemeral: true })
        return
      }
      uuid = convertedUUID
    } else {
      const resolvedName = await getUsernameFromUUID(input)
      if (resolvedName) name = resolvedName
    }

    const status = await checkIfUserIsOnline(uuid)

    if (!status) {
      await interaction.reply({ content: `Couldn't fetch status for \`${name}\`.`, ephemeral: true })
      return
    }

    const statusText = status.online
      ? `${name} is currently online playing ${status.game || "an unknown game"}.`
      : `${name} is currently offline.`

    await interaction.reply({
      content: statusText,
      ephemeral: true
    })
  }
}
