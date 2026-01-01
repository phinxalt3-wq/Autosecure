const isUrl = require("../../../autosecure/utils/utils/isUrl");

module.exports = {
 name: "footerurl",
 callback: (client, interaction) => {
  let footerurl = interaction.components[0].components[0].value;
  let data = interaction.message.embeds[0].data
  if (footerurl.length == 0) {
   if (data.footer) {
    data.footer.icon_url = null
   } else {
    data.footer = null
   }
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isUrl(footerurl)) {
   return interaction.update(`Invalid URL`)
  }
  if (data.footer) {
   data.footer.icon_url = footerurl
  } else {
   data.footer = { icon_url: footerurl }
  }
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}
