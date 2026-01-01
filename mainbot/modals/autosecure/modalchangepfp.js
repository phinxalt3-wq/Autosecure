const editautosecuremsg = require("../../../autosecure/utils/embeds/editautosecuremsg");
const isUrl = require("../../../autosecure/utils/utils/isUrl");
const config = require("../../../config.json");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "modalchangepfp",
    editautosecure: true,
    callback: async (client, interaction) => {
        try {
            const pfpUrl = interaction.fields.getTextInputValue("pfpurl");
            const [t, botnumber, ownerid] = interaction.customId.split("|");

            if (!pfpUrl) {
                await queryParams(
                    "UPDATE autosecure SET pfp = ? WHERE user_id = ? AND botnumber = ?",
                    [config.defaultpfp, ownerid, botnumber]
                );

                const msg = await editautosecuremsg(botnumber, ownerid);
                msg.content = "Set back to default PFP!";
                return await interaction.update(msg);
            }

            if (!isUrl(pfpUrl)) {
                return await interaction.reply({
                    content: "Not a valid URL!",
                    ephemeral: true
                });
            }

            await queryParams(
                "UPDATE autosecure SET pfp = ? WHERE user_id = ? AND botnumber = ?",
                [pfpUrl, ownerid, botnumber]
            );

            const msg = await editautosecuremsg(botnumber, ownerid);
            await interaction.update(msg);
        } catch (error) {
            console.error("Error in changepfp command:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "An error occurred while processing your request.",
                    ephemeral: true
                });
            }
        }
    }
};
