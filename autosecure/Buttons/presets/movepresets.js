const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg")

module.exports = {
    name: "movepresets",
    editpresets: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate()
        const [ , userid, botnumber, page ] = interaction.customId.split("|")

        const newPage = parseInt(page)
        if (isNaN(newPage) || newPage < 1) {
            return interaction.editReply({ content: "Invalid page number.", ephemeral: true })
        }

        const msgData = await editpresetsmsg(botnumber, userid, newPage)
        return interaction.editReply(msgData)
    }
}
