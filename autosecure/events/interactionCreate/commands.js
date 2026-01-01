const getLocalCmds = require('../../utils/utils/getLocalCmds');
const { join } = require('path');
const { queryParams } = require('../../../db/database');
const cliColor = require('cli-color');
const isblacklisted = require('../../../db/blacklist');
const isOwner = require("../../../db/isOwner");
const { EmbedBuilder } = require('discord.js');
const userpermissions = require('../../utils/embeds/userpermissions');

module.exports = async (client, interaction) => {
    const localCommands = getLocalCmds(join(__dirname, "..", "..", "Commands"));

    const [userperms] = await userpermissions();

    try {
        const cmdObj = localCommands.find((cmd) => cmd.name === interaction.commandName);
        if (!cmdObj) return;

        if (interaction.isAutocomplete()) {
            const blacklisted = await isblacklisted(interaction.user.id);
            if (blacklisted.blacklisted) {
                return interaction.respond([{ name: "You're blacklisted from Autosecure!", value: "blacklisted" }]);
            }

            if (cmdObj.autocomplete) {
                await cmdObj.autocomplete(client, interaction);
            }
            return;
        }

        if (interaction.isChatInputCommand()) {
            if (await checkBlacklist(interaction)) return;

            if (cmdObj.mail && client.username !== interaction.user.id) {
                let users = await client.queryParams(
                    `SELECT * FROM users WHERE user_id=? AND child=?`,
                    [client.username, interaction.user.id]
                );
                if (users.length === 0) {
                   return interaction.reply({ content: `You don't have access to mails! (no license / user of a bot)`, ephemeral: true });
                }
            }
for (const [cmdProp, { permission: dbPermission, description }] of Object.entries(userperms)) {
    if (cmdObj[cmdProp] && interaction.user.id !== client.username) {
        let users = await client.queryParams(
            `SELECT * FROM users WHERE user_id=? AND child=?`,
            [client.username, interaction.user.id]
        );

        if (users.length === 0) {
            return interaction.reply({
                content: `Invalid permissions!`,
                ephemeral: true,
            });
        }

        if (users[0][dbPermission] !== 1) {
            let msg = new EmbedBuilder()
                .setTitle('You do not have permissions for that!')
                .setDescription(`You need to have the \`${description}\` permission for that!`)
                .setColor('#cc2f21');

            return interaction.reply({ embeds: [msg], ephemeral: true });
        }
    }
}

            if (cmdObj.ownerOnly && interaction.user.id !== client.username && !(await isOwner(interaction.user.id))) {
             //   console.log(`${interaction.user.id} is not ${client.username}`);
                return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
            }

            if (cmdObj.adminOnly) {
                let users = await client.queryParams(
                    `SELECT * FROM users WHERE user_id=? AND child=?`,
                    [client.username, interaction.user.id]
                );
                if ((users.length === 0 || !users[0]?.admin) && client.username !== interaction.user.id) {
                    console.log(`Deprecated!`)
                    return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
                }
            }

            if (cmdObj.userOnly && client.username !== interaction.user.id) {
                return interaction.reply({ content: `You don't have access to this bot!`, ephemeral: true });
            }

            console.log(`/${cliColor.yellow(cmdObj.name)} ${interaction.user.username} ${new Date().toISOString()}`);

            if (cmdObj.execute) {
                await cmdObj.execute(client, interaction);
            } else if (cmdObj.callback) {
                await cmdObj.callback(client, interaction);
            }
        }

    } catch (e) {
        console.error('Command execution error:', e);
    }
};

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
