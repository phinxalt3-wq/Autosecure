const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const defaultModals = require("../../../autosecure/utils/responses/defaultModals");

module.exports = {
  name: "exampleModal",
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    const [modalData] = await queryParams(
      "SELECT modal FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    const userModalConfig = modalData ? JSON.parse(modalData.modal) : {};
    const defaultModalConfig = defaultModals[modalType];

    if (!defaultModalConfig) {
      return interaction.reply({
        content: `This is a pretty big issue, report this please, ty :)`,
        ephemeral: true
      });
    }

    const modalConfig = {
      title: userModalConfig.title || defaultModalConfig.title,
      setLabel: userModalConfig.setLabel || defaultModalConfig.setLabel,
      setPlaceholder: userModalConfig.setPlaceholder || defaultModalConfig.setPlaceholder,
      setStyle: userModalConfig.setStyle || defaultModalConfig.setStyle.toLowerCase(),
    };

    const modal = new ModalBuilder()
      .setCustomId(`exampleSubmit|${modalType}`)
      .setTitle(modalConfig.title);

    const textInput = new TextInputBuilder()
      .setCustomId("exampleInput")
      .setLabel(modalConfig.setLabel)
      .setPlaceholder(modalConfig.setPlaceholder)
      .setStyle(
        modalConfig.setStyle === "paragraph"
          ? TextInputStyle.Paragraph
          : TextInputStyle.Short
      );

    modal.addComponents(new ActionRowBuilder().addComponents(textInput));

    await interaction.showModal(modal);
  },
};
