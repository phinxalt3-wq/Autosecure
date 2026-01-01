const { TextInputStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../utils/modalBuilder");
const generate = require("../../utils/generate");
const getModal = require("../../utils/responses/getModal"); 

let sendCodeE = {
  name: `submitpreset`,
  callback: async (client, interaction) => {
    let id = interaction.customId.split("|").slice(1).join("|");
    let rId = generate(32);
    client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `submitpreset|${id}`]);

    try {
      const codeModalConfig = await getModal(client, "code");

      interaction.showModal(
        modalBuilder(`action|${rId}`, codeModalConfig.title, [
          {
            setCustomId: 'code',
            setMaxLength: 7,
            setMinLength: 6,
            setRequired: true,
            setLabel: codeModalConfig.setLabel,
            setPlaceholder: codeModalConfig.setPlaceholder,
            setStyle: codeModalConfig.setStyle === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
          },
        ])
      );
    } catch (e) {
      console.error("Error displaying modal:", e);
    }
  },
};

module.exports = sendCodeE;
