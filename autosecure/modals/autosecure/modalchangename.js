const editautosecuremsg = require("../../../autosecure/utils/embeds/editautosecuremsg.js");
const { queryParams } = require("../../../db/database.js");

module.exports = {
    name: "modalchangename",
    editautosecure: true,
    callback: async (client, interaction) => {
        try {
            let [t, botnumber, ownerid] = interaction.customId.split("|");
            const f = interaction.fields.getTextInputValue("firstname").trim();
            const last = interaction.fields.getTextInputValue("lastname").trim();

            let value = (f && last) ? `${f}|${last}` : null;

            await queryParams(
                `UPDATE autosecure SET name = ? WHERE user_id = ? AND botnumber = ?`,
                [value, ownerid, botnumber]
            );

            let msg = await editautosecuremsg(botnumber, ownerid);

            if (!value) {
                msg.content = "Reset to generated name!";
            } else {
                msg.content = "Updated name successfully!";
            }

            await interaction.update(msg);
        } catch (error) {
            console.error("Error in modalchangename:", error);
            await interaction.reply({ content: "❌ Failed to update name. Try again later.", ephemeral: true });
        }
    }
};
