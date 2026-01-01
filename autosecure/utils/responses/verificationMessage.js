const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const defaultEmbeds = require("./defaultEmbeds");

module.exports = async (client, userid, type, botnumber) => {

// USERID: Owner ID


    let d = false;
    let botnumber2;


    /*
    Double-Check
    */
    if (botnumber){
        botnumber2 = botnumber
    } else {
        botnumber2 = client.botnumber
    }


    /// Not needed embedjson
    // Save and delete need to be specified, done


    let msg = { content: "" };

        if (type === 'listaccount' || type === 'invalidated' || type.startsWith('dm') || type === "statsmsg") {
        d = true;
        }


    if (type === 'nomc') {
        msg.content = "This embed will only be shown when secure fake accounts is `disabled`.";
    }

    let embed = await queryParams(
        `SELECT * FROM embeds WHERE user_id=? AND type=? AND botnumber=?`,
        [userid, type, botnumber2]
    );


    if (embed.length === 0) {
        embed = defaultEmbeds(type, client);
    } else {
        embed = JSON.parse(embed[0].embed);
    }

    const loadEmbed = new ButtonBuilder().setCustomId(`loadembed|${type}|${botnumber2}|${userid}`).setLabel("Load Embed").setStyle(ButtonStyle.Primary);
    const saveEmbed = new ButtonBuilder().setCustomId(`saveembed|${type}|${botnumber2}|${userid}`).setLabel("Save Embed").setStyle(ButtonStyle.Success);
    const resetEmbed = new ButtonBuilder().setCustomId(`resetembed|${type}|${botnumber2}|${userid}`).setLabel("Reset Embed").setStyle(ButtonStyle.Danger);
    const exportEmbed = new ButtonBuilder().setCustomId(`exportembed|${type}|${botnumber2}|${userid}`).setLabel("Export Embed").setStyle(ButtonStyle.Secondary);
    const placeholders = new ButtonBuilder().setCustomId(`placeholders|${type}`).setLabel("Placeholders").setStyle(ButtonStyle.Secondary);
    const basicEditor = new ButtonBuilder().setCustomId(`basiceditor|${type}|${botnumber2}|${userid}`).setLabel("Basic Editor").setStyle(ButtonStyle.Secondary);

    const components = [
        new ActionRowBuilder().addComponents(loadEmbed, saveEmbed, resetEmbed, exportEmbed, placeholders),
        new ActionRowBuilder().addComponents(basicEditor)
    ];


    return {
        content: msg.content,
        embeds: [embed],
        components: components,
        ephemeral: true
    };
};
