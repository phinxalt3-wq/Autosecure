const { queryParams } = require("../../../db/database");
const getbotnumber = require("../../../db/getbotnumber");
const defaultEmbeds = require("../../utils/responses/defaultEmbeds");

module.exports = {
    name: "delete",
    editembeds: true,
    callback: async (client, interaction) => {
        let type = interaction.customId.split("|")[1];
        let botnumber = await getbotnumber(interaction, client, 2, "delete.js");
        let userid = interaction.customId.split("|")[3]
        let defaultEmbed = defaultEmbeds(type);

        await queryParams(
            `DELETE FROM embeds WHERE type=? AND user_id=? AND botnumber=?`,
            [type, userid, botnumber]
        );

        const currentComponents = interaction.message.components;
        const currentContent = interaction.message.content;

        return interaction.update({
            content: `Removed your ${type} embed!`,
            embeds: [defaultEmbed],
            components: currentComponents
        });
    }
};
