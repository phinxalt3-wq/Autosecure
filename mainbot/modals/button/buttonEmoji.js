const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "buttonemoji",
  callback: async (client, interaction) => {
    const emojiInput = interaction.components[0].components[0].value.trim();
    const type = interaction.customId.split("|")[1];

    const newComponents = [];

    for (let row of interaction.message.components) {
      const actionRow = new ActionRowBuilder();
      for (let comp of row.components) {
        const isLinkButton = comp.style === ButtonStyle.Link;
        const isOwnButton = comp.customId && comp.customId.startsWith("ownbutton|");

        const button = ButtonBuilder.from(comp);

        const shouldModify = 
          (type === "oauth" && isLinkButton) || 
          (type !== "oauth" && isOwnButton);

        if (shouldModify) {
          if (emojiInput) {
            try {
              if (/^:[a-zA-Z0-9_]+:$/.test(emojiInput)) {
                const emojiName = emojiInput.slice(1, -1);
                const emoji = client.emojis.cache.find(e => e.name === emojiName);

                if (emoji) {
                  button.setEmoji(emoji.id);
                } else {
                  return interaction.update({ 
                    content: `Emoji ${emojiInput} not found in server. Maybe it isn't a custom server emoji? \nFor standard discord emojis like :skull:, please use services like https://https://emojipedia.org/. Try using the ID if this check failed!`,
                    components: interaction.message.components,
                    ephemeral: true 
                  });
                }
              } else if (/^\d+$/.test(emojiInput)) {
                button.setEmoji({ id: emojiInput });
              } else {
                if (/^[a-zA-Z]+$/.test(emojiInput)) {
                  return interaction.reply({
                    content: `Invalid emoji chosen`,
                    ephemeral: true
                  });
                }
                button.setEmoji(emojiInput);
              }
            } catch (e) {
              return interaction.update({ 
                content: `Invalid emoji format`,
                components: interaction.message.components,
                ephemeral: true 
              });
            }
          } else {
            if (comp.label) {
              button.data.emoji = undefined;
            } else {
              await interaction.update({ 
                content: `Buttons must have either a label or emoji.`,
                components: interaction.message.components,
                ephemeral: true 
              });
              return;
            }
          }
        }

        actionRow.addComponents(button);
      }
      newComponents.push(actionRow);
    }

    await interaction.update({ content: null, components: newComponents });
  }
};
