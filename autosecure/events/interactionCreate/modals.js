const getModals = require('../../utils/responses/getModals');
const { queryParams } = require('../../../db/database');
const clicolor = require("cli-color");
const isblacklisted = require("../../../db/blacklist");
const userpermissions = require("../../utils/embeds/userpermissions");
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, interaction) => {
    if (await checkBlacklist(interaction)) return;
    if (!interaction.isModalSubmit()) return;

    try {
        let modal = client.modals.find((m) => m.name === interaction.customId.split("|")[0]);

        if (interaction.customId.includes("|cc")) {
            modal = client.modals.find((m) => m.name === `verify code`);
        }

        if (interaction.customId.split("|")[0] === "action") {
            let action = await client.queryParams(`SELECT * FROM actions WHERE id=?`, [
                interaction.customId.split("|")[1],
            ]);
            if (action.length === 0) {
                return interaction.reply({
                    embeds: [
                        {
                            title: `Error :x:`,
                            description: `Please try again later!`,
                            color: 0xff0000,
                        },
                    ],
                    ephemeral: true,
                });
            }
            interaction.customId = action[0].action;
            modal = client.modals.find((m) => m.name === interaction.customId.split("|")[0]);
        }

        if (!modal) return;

        if (modal.ownerOnly) {
            if (interaction.user.id !== client.username) {
                return interaction.reply({ content: `Invalid permissions!`, ephemeral: true });
            }
        }

        if (modal.userOnly) {
            if (client.username !== interaction.user.id) {
                return interaction.reply({ content: `You don't have access to this bot!`, ephemeral: true });
            }
        }

        const [userperms] = await userpermissions();
        const users = await client.queryParams(
            `SELECT * FROM users WHERE user_id=? AND child=?`,
            [client.username, interaction.user.id]
        );

for (const [permKey, { permission: dbColumn, description }] of Object.entries(userperms)) {
    if (modal[permKey] && interaction.user.id !== client.username) {
        if (users.length === 0) {
            return interaction.reply({
                content: `Invalid permissions!`,
                ephemeral: true,
            });
        }

        if (users[0][dbColumn] !== 1) {
            const embed = new EmbedBuilder()
                .setTitle('You do not have permissions for that!')
                .setDescription(`You need to have the \`${description}\` permission to use this modal.`)
                .setColor('#cc2f21');

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}


        console.log(`M]${clicolor.yellow(modal.name)} ${clicolor.blue(interaction.user.username)} ${clicolor.red(interaction.customId)}`);

        await modal.callback(client, interaction);
    } catch (e) {
        console.log(e);
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
