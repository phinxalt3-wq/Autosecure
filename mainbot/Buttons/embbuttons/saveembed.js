const { queryParams } = require("../../../db/database");
const getbotnumber = require("../../../db/getbotnumber");

module.exports = {
    name: "saveembed",
    editembeds: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();

        let embed = interaction.message.embeds[0].data;
        let type = interaction.customId.split("|")[1];
        let botnumber = interaction.customId.split("|")[2];
        let userid = interaction.customId.split("|")[3];
        
        let d = await queryParams(
            `SELECT * FROM embeds WHERE user_id=? AND type=? AND botnumber=? LIMIT 1`,
            [userid, type, botnumber]
        );

        if (d.length === 0) {
            await queryParams(
                `INSERT INTO embeds (user_id, type, embed, botnumber) VALUES (?, ?, ?, ?)`,
                [userid, type, JSON.stringify(embed), botnumber]
            );
            return interaction.editReply({ content: `Saved your ${type} embed!` });
        } else {
            await queryParams(
                `UPDATE embeds SET embed=? WHERE user_id=? AND type=? AND botnumber=?`,
                [JSON.stringify(embed), userid, type, botnumber]
            );
            return interaction.editReply({ content: `Updated your ${type} embed!` });
        }
    }
};
