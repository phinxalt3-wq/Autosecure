const isUrl = require("../../utils/utils/isUrl");

module.exports = {
 name: "thumbnail",
 callback: (client, interaction) => {
  let thumbnail = interaction.components[0].components[0].value;
  if (thumbnail.length == 0) {
   interaction.message.embeds[0].data.thumbnail = null
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isUrl(thumbnail)) {
   return interaction.update(`Invalid URL`)
  }
  interaction.message.embeds[0].data.thumbnail = { url: thumbnail }
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}
