const defaultEmbeds = require("./defaultEmbeds")
const { EmbedBuilder } = require("discord.js")

module.exports = async (client, embed, var1, var2) => {
    const id = client.username
    const results = await client.queryParams(`SELECT * FROM embeds WHERE user_id = ? AND type = ?`, [id, embed])
    let settings = null
    let verifymsg = null
    let alreadygotmsg = false
    let msg

    if (embed === "dm1" || embed === "dm2") {
        settings = await client.queryParams(`SELECT * FROM settings WHERE user_id = ?`, [id])
        settings = settings[0]
        verifymsg = settings?.verifymsg
        alreadygotmsg = true
        if (results.length === 0) {
            msg = defaultEmbeds(embed, client)
            if (var1){
            msg.description = msg.description.replaceAll("(guildname)", var1)
            }
            if (var2){
            msg.description = msg.description.replaceAll("(verifymsg)", verifymsg || "verify")
            }
        }
    }

    if (results.length === 0 && !alreadygotmsg) {
        msg = defaultEmbeds(embed)
    } else if (!msg) {
        try {
            msg = JSON.parse(results[0].embed)
        } catch {
            console.log(`smth failed!`)
            return new EmbedBuilder()
                .setDescription("Failed to find the embed!")
                .setColor(0xFF0000)
        }
    }

    if (!msg || !msg.description) {
        console.log(`smth failed!`)
    }

    if (var1) {
        msg.description = msg.description.replaceAll("(sec)", var1)
    }

    if (var2) {
        msg.description = msg.description.replaceAll("{2}", var2)
        msg.description = msg.description.replaceAll("{username}", var2)
    }

    return msg
}
