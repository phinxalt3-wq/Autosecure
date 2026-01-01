const getUnclaimedMessage = require("../../utils/embeds/unclaimedMessage");

module.exports = {
    name: "unclaimedmodal",
    userOnly: true,
    callback: async (client, interaction) => {
        let page = interaction.components[0].components[0].value;

        if (isNaN(page) || page.trim() === "") {
            return interaction.reply({ content: "Please enter a number.", ephemeral: true });
        }

        return interaction.update(await getUnclaimedMessage(client, Number(page)));
    }
};
