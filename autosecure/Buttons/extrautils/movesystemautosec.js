const blacklistedmsg = require("../../utils/bot/blacklistedmsg");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database")

module.exports = {
    name: "movesystem",
    editblacklist: true,
    callback: async (client, interaction) => {
        let [t, db, currentStr, direction, botnumber, ownerid] = interaction.customId.split("|");
        let dbtable = db === "blacklisted" || db === "blacklistedemails" ? "client_id" : "user_id";
        let userId = interaction.user.id;

        if (direction === "add" || direction === "remove") {
            let inputLabel, placeholder;
            if (db === "blacklisted") {
                inputLabel = `User ID to ${direction}`;
                placeholder = direction === "add" ? "123456789012345678" : "Enter user ID to remove";
            } else if (db === "blacklistedemails") {
                inputLabel = `Email to ${direction}`;
                placeholder = direction === "add" ? "user@example.com" : "Enter email to remove";
            } else {
                inputLabel = `Entry to ${direction}`;
                placeholder = `Enter value to ${direction}`;
            }

            const modal = new ModalBuilder()
                .setCustomId(`modalsystem|${db}|${currentStr}|${direction}|${botnumber}|${ownerid}`)
                .setTitle(`${direction === 'add' ? 'Add to' : 'Remove from'} ${db === 'blacklisted' ? 'Blacklisted Users' : 'Blacklisted Emails'}`);

            const input = new TextInputBuilder()
                .setCustomId('entry_input')
                .setLabel(inputLabel)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(input);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
            return;
        }

        let rows = await queryParams(
            `SELECT * FROM ${db} WHERE ${dbtable} = ? AND botnumber = ?`,
            [userId, botnumber]
        );

        const itemsPerPage = {
            blacklisted: 10,
            blacklistedemails: 10,
        };
        let perPage = itemsPerPage[db] || 1;
        let max = Math.ceil(rows.length / perPage);
        let min = 1;
        let current = Number(currentStr);
        let move = current;

        switch (direction) {
            case "forward":
                move = current + 1;
                break;
            case "backward":
                move = current - 1;
                break;
            case "fastforward":
                move = max;
                break;
            case "fastbackward":
                move = min;
                break;
        }

        if (move < min) move = min;
        if (move > max) move = max;

        let msg;
        if (db === "blacklisted" || db === "blacklistedemails") {
            msg = await blacklistedmsg(botnumber, client, userId, db, move);
        }

        return interaction.update(msg || { content: "That's not an option, is it?", ephemeral: true });
    }
};