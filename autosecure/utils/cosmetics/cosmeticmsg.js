const getcosmetics = require("./getcosmetics")
const { EmbedBuilder } = require('discord.js')

module.exports = async function cosmeticmsg(ign, type) {
  let cosmetics = await getcosmetics(ign)
  // console.log(cosmetics)

  let typeLower = type.toLowerCase()
  let specificdatapath = cosmetics[typeLower]

  if (!specificdatapath) {
    let failedembed = new EmbedBuilder()
      .setTitle(`${type} Cosmetics`)
      .setDescription(`None`)
      .setColor(0xADD8E6)
    return { embeds: [failedembed] }
  }

  let amount = specificdatapath.amount ?? '0'
  let embed = new EmbedBuilder()
    .setTitle(`${type} Cosmetics`)
    .setDescription(`Amount: ${amount}\n`)
    .setColor(0xADD8E6)

  if (specificdatapath.data) {
    let parsedData = JSON.parse(specificdatapath.data)

    if (Array.isArray(parsedData)) {
      if (typeof parsedData[0] === 'string') {
        parsedData.forEach(item => {
          embed.setDescription(embed.data.description + "- " + item + "\n")
        })
      } else {
        parsedData.forEach(item => {
          let name = item.cosmetic_name || "Unknown"
          let type = item.cosmetic_type || ""
          if (type) {
            embed.setDescription(embed.data.description + `- ${name} (${type})\n`)
          } else {
            embed.setDescription(embed.data.description + `- ${name}\n`)
          }
        })
      }
    }
  }

  return { embeds: [embed] }
}
