const { queryParams } = require("../../../db/database")

module.exports = {
  name: "buttoncolor",
  callback: async (client, interaction) => {

    const color = interaction.components[0].components[0].value

    let style
    switch (color.toLowerCase()) {
      case "red":
        style = 4
        break
      case "blue":
        style = 1
        break
      case "green":
        style = 3
        break
      case "gray":
        style = 2
        break
      default:
        return interaction.update({ content: `Invalid color! You are limited to these 4 colors: Red, Green, Blue, Gray` })
    }

    const type = interaction.customId.split("|")[1]

    for (const row of interaction.message.components) {
      for (const comp of row.components) {

        if (type === "oauth" && comp.data.style === 5) {
          // OAuth Link button: update style to new style, keep url, remove custom_id
          comp.data.style = style
          if (style === 5) {
            delete comp.data.custom_id
            // keep url as is
          } else {
            delete comp.data.url
            comp.data.custom_id = `ownbutton|${type}` // must be unique
          }
        } else {
          // For other buttons or non-OAuth ownbuttons:
          if (comp.data.custom_id && comp.data.custom_id.startsWith("ownbutton|")) {
            comp.data.style = style
            delete comp.data.url
            // custom_id remains same and unique
          }
        }
      }
    }

    await interaction.update({ content: null, components: interaction.message.components })
  }
}
