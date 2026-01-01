const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const getButton = require("../../utils/responses/getButton");

// Helper function to safely reply to interactions
async function safeReply(interaction, options) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(options);
    } else {
      await interaction.reply(options);
    }
  } catch (error) {
    if (error.code === 10062) {
      // Unknown interaction - try followUp as last resort
      try {
        await interaction.followUp({ ...options, ephemeral: true });
      } catch (followUpError) {
        console.error('[SENDDM] Failed to followUp after unknown interaction:', followUpError.message);
      }
    } else {
      console.error('[SENDDM] Failed to reply to interaction:', error.message);
    }
  }
}

const senddm = {
  name: "senddm",
  usedmbuttons: true,
  callback: async (client, interaction) => {
    // Defer reply immediately to prevent interaction timeout
    const deferred = interaction.deferred || interaction.replied;
    if (!deferred) {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (deferError) {
        // If defer fails, interaction might already be expired
        console.error('[SENDDM] Failed to defer interaction:', deferError.message);
      }
    }

    try {
      let msg = interaction.fields.getTextInputValue("msg") || "";
      let presetname = interaction.fields.getTextInputValue("preset") || "";
      let userid = interaction.customId.split("|")[1];

      if (!msg && !presetname) {
        await safeReply(interaction, { content: "Please enter at least one option (message or preset).", ephemeral: true });
        return;
      }

      let preset = [];
      if (presetname) {
        preset = await client.queryParams("SELECT * FROM presets WHERE user_id=? AND name=?", [client.username, presetname]);
      }

      let presetMsg = preset.length > 0 ? preset[0].preset : null;
      let buttonlabel = preset.length > 0 ? preset[0].buttonlabel : null;
      let buttonlink = preset.length > 0 ? preset[0].buttonlink : null;

      if (!presetMsg && !msg) {
        await safeReply(interaction, { content: "Non-existing preset.", ephemeral: true });
        return;
      }

      let user = await client.users.fetch(userid);
      if (!user) {
        await safeReply(interaction, { content: "User not found.", ephemeral: true });
        return;
      }

      if (presetMsg) {
        let embed = new EmbedBuilder(JSON.parse(presetMsg));
        let responseOptions = { embeds: [embed] };

        // Add button if both label and link exist
        if (buttonlabel && buttonlink) {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel(buttonlabel)
                .setURL(buttonlink)
                .setStyle(ButtonStyle.Link)
            );
          responseOptions.components = [row];
        }

        await user.send(responseOptions);
      } else {
        await user.send(msg);
      }

      await safeReply(interaction, { content: "Message sent successfully!", ephemeral: true });
    } catch (error) {
      console.error('[SENDDM] Error:', error);
      
      const errorMessage = error.code === 50007 
        ? "Failed to send the message. The user may have DMs disabled or the bot doesn't share a server with them."
        : `Failed to send the message: ${error.message || 'Unknown error'}`;
      
      await safeReply(interaction, { 
        content: errorMessage, 
        ephemeral: true 
      });
    }
  }
};

module.exports = senddm;