const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");

module.exports = async function editclaimmsg(botnumber, ownerid, obj = {}) {
    const check = await queryParams(`SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?`, [ownerid, botnumber]);
    const settings = check[0];

    const users = await queryParams(`SELECT * FROM users WHERE user_id = ? AND botnumber = ?`, [ownerid, botnumber]);
    const userCount = users.filter(u => u.child !== null && u.child !== "").length;



    const embed = new EmbedBuilder()
        .setTitle("Your Claim Config")
        .setColor(0xADD8E6)
        .addFields(
            { name: "Claiming", value: settings.claiming ? "Yes" : "No", inline: true },
            { name: "Ping", value: settings.ping, inline: true },
            { name: "Server ID", value: settings.server_id ? `${settings.server_id}` : "Not set", inline: true },
            { name: "Users channel", value: settings.users_channel ? `<#${settings.users_channel.split("|")[0]}>` : "Not set", inline: true },
            { name: "Notification Channel", value: settings.notification_channel ? `<#${settings.notification_channel.split("|")[0]}>` : "Not set", inline: true },
            { name: "Amount of Users", value: `${userCount}`, inline: true }
        );

        //TD    

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId(`enableclaiming|${botnumber}|${ownerid}`)
        .setLabel("Claiming")
        .setStyle(ButtonStyle.Success),
         new ButtonBuilder()
        .setCustomId(`changeping|${botnumber}|${ownerid}`)
        .setLabel(`Change Ping`)
        .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
        .setCustomId(`manageusers|${botnumber}|${ownerid}`)
        .setLabel("Claim Users")
        .setStyle(ButtonStyle.Primary)
    );

    return { embeds: [embed], components: [buttons], ephemeral: true };
}
