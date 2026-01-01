const { queryParams } = require("../../../db/database");

module.exports = {
  name: "buttonlabel",
  callback: async (client, interaction) => {
    const label = interaction.components[0].components[0].value;
    const type = interaction.customId.split("|")[1];

    if (type === "oauth") {
      for (let row of interaction.message.components) {
        for (let comp of row.components) {
          if (comp.data.style === 5) { // Link buttons
            if (label === null || label.trim() === "") {
              if (comp.data.emoji) {
                delete comp.data.label;
              } else {
                await interaction.update({ 
                  content: `Link buttons must have either a label or emoji.`, 
                  components: interaction.message.components, 
                  ephemeral: true 
                });
                return;
              }
            } else {
              comp.data.label = label;
            }
          }
        }
      }
    } else {
      for (let row of interaction.message.components) {
        for (let comp of row.components) {
          let id = comp?.data?.custom_id;
          if (id && id.startsWith("ownbutton|")) {
            if (label === null || label.trim() === "") {
              if (comp.data.emoji) {
                delete comp.data.label;
              } else {
                await interaction.update({ 
                  content: `Buttons must have either a label or emoji.`, 
                  components: interaction.message.components, 
                  ephemeral: true 
                });
                return;
              }
            } else {
              comp.data.label = label;
            }
          }
        }
      }
    }

    await interaction.update({ content: null, components: interaction.message.components });
  }
};