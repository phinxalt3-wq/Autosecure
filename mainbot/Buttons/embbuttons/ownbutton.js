const { queryParams } = require("../../../db/database")

module.exports = {
 name: "ownbutton",
 callback: async (client, interaction) => {
    await interaction.update({
        content: `This is just a preiew, use the buttons to manage your button.`,
    })
 }
}
