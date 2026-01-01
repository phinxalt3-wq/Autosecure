module.exports = {
 name: "footer",
 callback: (client, interaction) => {
  let footer = interaction.components[0].components[0].value;
  let data = interaction.message.embeds[0].data
  if (data.footer) {
   data.footer.text = footer
  } else {
   data.footer = { text: footer }
  }
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}