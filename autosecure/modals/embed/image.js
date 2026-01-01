const isUrl = require("../../utils/utils/isUrl");

module.exports = {
 name: "image",
 callback: (client, interaction) => {
  let image = interaction.components[0].components[0].value;
  if (image.length == 0) {
   interaction.message.embeds[0].data.image = null
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isUrl(image)) {
   return interaction.update(`Invalid URL`)
  }
  interaction.message.embeds[0].data.image = { url: image }
  return interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}
