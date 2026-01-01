const { queryParams } = require("../../../db/database")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = async function editpresetsmsg(botnumber, userid, page) {
    const itemsPerPage = 10

    const allPresets = await queryParams(
        `SELECT * FROM presets WHERE user_id = ? AND botnumber = ? ORDER BY time ASC`,
        [userid, botnumber]
    )

    const totalCount = allPresets.length
    const maxPage = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    page = Math.max(1, parseInt(page) || 1)  
    page = Math.min(page, maxPage)           

    const startIndex = (page - 1) * itemsPerPage
    const presets = allPresets.slice(startIndex, startIndex + itemsPerPage)

    let embed = {
        title: "Manage your presets!",
        color: 0xc8a2c8,
        footer: { text: `Page ${page}/${maxPage}` },
        description: presets.length
            ? presets.map((p, i) => `${startIndex + i + 1} | ${p.name}`).join("\n")
            : "Nothing found for this page"
    }

    const buttons1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`createpreset1|${userid}|${botnumber}`)
            .setLabel("+ Create")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`editpreset1|${userid}|${botnumber}|${page}`)
            .setLabel("Edit")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`deletepreset1|${userid}|${botnumber}|${page}`)
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
        .setCustomId(`presetex|${userid}|${botnumber}|${page}`)
        .setLabel("Show example")
        .setStyle(ButtonStyle.Secondary)
    )

    const buttons2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`movepresets|${userid}|${botnumber}|1|fastbackward`)
            .setEmoji({ name: "⏪" })
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId(`movepresets|${userid}|${botnumber}|${page - 1}|backward`)
            .setEmoji({ name: "◀️" })
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId(`currentpresets|${userid}|${botnumber}`)
            .setLabel(`${page}/${maxPage}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(`movepresets|${userid}|${botnumber}|${page + 1}|forward`)
            .setEmoji({ name: "➡️" })
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === maxPage),
        new ButtonBuilder()
            .setCustomId(`movepresets|${userid}|${botnumber}|${maxPage}|fastforward`)
            .setEmoji({ name: "⏩" })
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === maxPage)
    )

    return {
        content: '',
        embeds: [embed],
        components: [buttons2, buttons1],
        ephemeral: true
    }
}