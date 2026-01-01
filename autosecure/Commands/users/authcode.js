const generateotp = require("../../utils/secure/codefromsecret");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "authcode",
    description: "Generate an OTP with a 2FA Secret Key.",
    userOnly: true,
    options: [
        {
            name: "secret",
            description: "Secret Key.",
            type: 3,
            required: true
        }
    ],
    callback: async (client, interaction) => {
        const secretKey = interaction.options.getString("secret");
        try {
            let data = await generateotp(secretKey);
            let code;
            if (data && data.otp) {
                code = data.otp;
            }
            if (!code) {
                return interaction.reply({
                    content: "Invalid secret key. Please provide a valid 2FA secret key.",
                    ephemeral: true
                });
            }
            const relativeTime = `<t:${data.nextResetEpoch}:R>`;
            const embed = new EmbedBuilder()
                .setTitle("Authenticator Code")
                .setDescription(`\`\`\`\n${code}\n\`\`\`\nExpires: ${relativeTime}`)
                .setColor("#808080");

            const refreshButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`tfa|${secretKey}`)
                    .setLabel("Refresh Code")
                    .setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [refreshButton],
                ephemeral: true
            });
        } catch (error) {
            console.error("Error generating OTP:", error);
            return interaction.reply({
                content: "An error occurred while generating the authentication code. Please check your secret key and try again.",
                ephemeral: true
            });
        }
    }
};