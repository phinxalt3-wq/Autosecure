const showproxiespanel = require("../../../autosecure/utils/utils/showproxiespanel");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "removeproxies",
    callback: async (client, interaction) => {
        const command = `DELETE FROM proxies WHERE user_id = ?`;
        const userId = interaction.user.id
        const params = [userId];

        try {
            await client.queryParams(command, params);
            const msg = await showproxiespanel(client, interaction.user.id);

            msg.content = 'Removed all proxies!';
            return interaction.update(msg);
        } catch (error) {
            console.error("Error removing proxies:", error);
            return interaction.reply("An error occurred while removing proxies.");
        }
    }
}
