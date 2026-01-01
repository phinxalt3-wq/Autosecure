const { queryParams } = require("../../../db/database");
const defaultEmbeds = require("../../../autosecure/utils/responses/defaultEmbeds");

module.exports = {
    name: "resetembed",
    editembeds: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();

        let type = interaction.customId.split("|")[1];
        let botnumber = interaction.customId.split("|")[2];
        let userid = interaction.customId.split("|")[3];

        // Delete the custom embed from database
        await queryParams(
            `DELETE FROM embeds WHERE user_id=? AND type=? AND botnumber=?`,
            [userid, type, botnumber]
        );

        // Get the default embed
        let defaultEmbed = defaultEmbeds(type, client);

        return interaction.editReply({ 
            content: `Reset ${type} embed to default!`,
            embeds: [defaultEmbed]
        });
    }
};
