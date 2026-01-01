const { ActivityType } = require("discord.js");
const { queryParams } = require("../../../db/database"); 
module.exports = {
    name: "botstatus",
    ownerOnly: true,
    callback: async (client, interaction) => {
        const status = interaction.components[0].components[0].value;
        const state = interaction.components[1].components[0].value;


        if (!["online", "dnd", "idle", "invisible"].includes(state)) {
            return interaction.reply({ content: `Invalid status!`, ephemeral: true });
        }

        const userId = interaction.user.id;


        await client.queryParams(`UPDATE autosecure SET status=? WHERE user_id=?`, [`${status}|${state}`, userId]);


        client.user.setPresence({
            activities: [{
                name: status,
                type: ActivityType.Custom,
            }],
            status: state
        });


        const adminResponse = await require("../../utils/settings/listSettings")(userId, false); // Call the listSettings function directly here
        await interaction.update({
            content: `Changed your bot status!\nKeep in mind, it might take a few minutes to be updated fully!`,
            embeds: adminResponse.embeds,
            components: adminResponse.components,
            ephemeral: true
        });
    }
};


module.exports.getBotStatus = async (userId) => {
    const result = await client.queryParams(`SELECT status FROM autosecure WHERE user_id=?`, [userId]);
    if (result.length > 0 && result[0].status) {
        const [status, state] = result[0].status.split('|');
        return `${status} (${state})`; // Return a formatted status string
    }
    return "Not set"; // Default return if no status is found
};
