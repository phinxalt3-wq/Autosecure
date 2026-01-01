const editautosecuremsg = require("../../../autosecure/utils/embeds/editautosecuremsg");
const { getLanguageCode, languageData } = require("../../../autosecure/utils/process/helpers");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "modalchangelanguage",
    editautosecure: true,
    callback: async (client, interaction) => {
        try {
            const languagesubmitted = interaction.fields.getTextInputValue("language").trim(); // Added trim()
            const [t, botnumber, ownerid] = interaction.customId.split("|");

            if (!languagesubmitted) {
                await queryParams(
                    "UPDATE autosecure SET language = ? WHERE user_id = ? AND botnumber = ?",
                    ['en-US', ownerid, botnumber]
                );

                const msg = await editautosecuremsg(botnumber, ownerid);
                msg.content = "✅ Set back to default language (en-US)!";
                return await interaction.update(msg);
            }

            let checkedlang = await getLanguageCode(languagesubmitted);
            if (!checkedlang) {
                const msg = await editautosecuremsg(botnumber, ownerid);
                msg.content = "❌ Invalid language! Please use a valid language name or code.";
                return await interaction.update(msg);
            }

            await queryParams(
                "UPDATE autosecure SET language = ? WHERE user_id = ? AND botnumber = ?",
                [checkedlang, ownerid, botnumber]
            );

            const msg = await editautosecuremsg(botnumber, ownerid);
            msg.content = `✅ Language set to: ${languageData[checkedlang] || checkedlang}`;
            await interaction.update(msg);
        } catch (error) {
            console.error("Error in modalchangelanguage command:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "⚠️ An error occurred while processing your request.",
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: "⚠️ An error occurred while processing your request.",
                    ephemeral: true
                });
            }
        }
    }
};