const { TextInputStyle } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");

module.exports = {
    name: "browsersecure",
    description: "Test the experimental browser-based recovery secure",
    enabled: true,
    userOnly: true,
    callback: async (client, interaction) => {
        return interaction.showModal(
            modalBuilder("browserrecsecure", "Browser Recovery Secure", [
                {
                    setCustomId: "email",
                    setMaxLength: 200,
                    setMinLength: 1,
                    setRequired: true,
                    setLabel: "Email",
                    setPlaceholder: "Ex: example@outlook.com",
                    setStyle: TextInputStyle.Short
                },
                {
                    setCustomId: "recovery_code",
                    setMaxLength: 40,
                    setMinLength: 1,
                    setRequired: true,
                    setLabel: "Recovery Code",
                    setPlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
                    setStyle: TextInputStyle.Short
                }
            ])
        );
    }
};

