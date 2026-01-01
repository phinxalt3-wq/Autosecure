const generateotp = require("../../utils/secure/codefromsecret");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "auth",
    description: "Button handler for generating 2FA codes",
    userOnly: true,
    callback: async (client, interaction) => {
        try {

            const [, secretKey] = interaction.customId.split("|");


if (
    !secretKey ||
    secretKey === 'Disabled' ||
    secretKey === 'Option is disabled.' ||
    secretKey === 'Failed to add' ||
    secretKey.replace(/\s/g, '') === 'Optionisdisabled.' ||
    secretKey.replace(/\s/g, '') === 'Failedtoadd' ||
    secretKey.replace(/\s/g, '') === 'Disabled'
) {
    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("No secret key available for this account.")
                .setColor("#87CEEB")
        ],
        ephemeral: true
    });
}

            

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
                content: "An error occurred while generating the authentication code.",
                ephemeral: true
            });
        }
    }
};