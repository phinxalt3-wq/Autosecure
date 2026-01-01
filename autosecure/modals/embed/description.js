module.exports = {
 name: "description",
 callback: (client, interaction) => {
  let description = interaction.components[0].components[0].value;
  interaction.message.embeds[0].data.description = description
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}