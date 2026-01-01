const { ButtonBuilder, ButtonStyle } = require("discord.js")
const { queryParams } = require("../../../db/database")
const defaultButtons = require("./defaultButtons")

module.exports = async (client, type, obj) => {
  //  console.log(`Getting called!`)
    let id = client.username
    let button = await client.queryParams(`SELECT * FROM buttons WHERE user_id=? AND type=?`, [id, type])
    if (button.length == 0) {
        return defaultButtons(type, obj)
    } else {
        let data = JSON.parse(button[0].button)
        if (type == "oauth") {
            data.url = obj.url
        }
        button = new ButtonBuilder()
        button.data = data
        return button
    }
}