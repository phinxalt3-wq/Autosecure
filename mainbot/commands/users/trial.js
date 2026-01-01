const access = require("../../../db/access");
const { queryParams } = require("../../../db/database");
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require("../../../config.json");
const generate = require("../../../autosecure/utils/generate");
const { roleid, guildid, notifierWebhook } = require("../../../config.json");
const axios = require("axios"); 
const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const quicksetupmsg = require('../../../autosecure/utils/embeds/quicksetupmsg');

module.exports = {
  name: "trial",
  description: `Get a temporary trial to Autosecure!`,
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      let hasAccess = await access(interaction.user.id);
      if (hasAccess) {
        return interaction.editReply({
          content: "You already have access to Autosecure!"
        });
      }

      const trialCheck = await queryParams(
        "SELECT trial FROM trial WHERE user_id = ?",
        [interaction.user.id]
      );
      if (trialCheck.length > 0 && trialCheck[0].trial === "true") {
        const embed = new EmbedBuilder()
          .setColor(0xADD8E6)
          .setDescription(`You already had a trial or access!`);

        const button = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.shoplink);

        const button2 = new ButtonBuilder()
          .setLabel('Join Server')
          .setCustomId('joinserver')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button, button2);

        return interaction.editReply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }

      const MS_PER_H = 3600000;
      const durationMs = parseInt(config.trial) * MS_PER_H;
      const expiry = Date.now() + durationMs;
      const key = `${config.footer1}-${generate(16)}`;

      await queryParams(
        "INSERT INTO usedLicenses(license, user_id, expiry, one_day_warning_sent, seven_day_warning_sent, istrial) VALUES(?, ?, ?, 0, 0, 1)",
        [key, interaction.user.id, expiry.toString()]
      );

      await queryParams(
        "INSERT INTO autosecure(user_id) VALUES(?)",
        [interaction.user.id]
      );

      await queryParams(
        "INSERT INTO secureconfig(user_id) VALUES(?)",
        [interaction.user.id]
      );

      const existingtrial = await queryParams(
        "SELECT * FROM trial WHERE user_id = ?",
        [interaction.user.id]
      );

      if (existingtrial.length > 0) {
        await queryParams(
          "UPDATE trial SET trial = ? WHERE user_id = ?",
          ["true", interaction.user.id]
        );
      } else {
        await queryParams(
          "INSERT INTO trial (user_id, trial) VALUES (?, ?)",
          [interaction.user.id, "true"]
        );
      }

      const slots = await queryParams(
        "SELECT slots FROM slots WHERE user_id = ?",
        [interaction.user.id]
      );

      if (slots && slots.length > 0) {
        await queryParams(
          "UPDATE slots SET slots = ? WHERE user_id = ?",
          [1, interaction.user.id]
        );
      } else {
        await queryParams(
          "INSERT INTO slots(user_id, slots) VALUES(?, ?)",
          [interaction.user.id, 1]
        );
      }

      const expiryTimestamp = Math.floor(expiry / 1000);
      const hourstime = Math.round(parseInt(config.trial));

      // New embed style
      const embed = new EmbedBuilder()
        .setColor(0x5f9ea0)
        .setTitle(`✅ **Trial activated**`)
        .setDescription(`\n\n__**Details**__\n**Status:** Active\n**Expires:** <t:${expiryTimestamp}:R>\n**User:** <@${interaction.user.id}>`)
        .setFooter({ text: `Powered by Phinxz` })
        .setTimestamp();

      try {
        await autosecurelogs(client, "trial", interaction.user.id, null, null, null, expiryTimestamp);
        
        // Send trial activation embed
        await interaction.user.send({ embeds: [embed] });
        
        // Send setup guide embed
        const setupGuide = await quicksetupmsg(true, false);
        await interaction.user.send(setupGuide);
      } catch (dmError) {
        console.error("Could not DM user:", dmError);
        await interaction.editReply({
          content: `**You've been granted a ${hourstime}h trial!**\nExpires: <t:${expiryTimestamp}:R>\n\n⚠️ Could not send DMs. Please enable DMs from server members.`,
          ephemeral: true
        });
        return;
      }

      try {
        const guild = await client.guilds.fetch(guildid);
        const member = await guild.members.fetch(interaction.user.id);
        await member.roles.add(roleid);
        console.log(`Successfully assigned role to ${interaction.user.tag}`);
      } catch (roleError) {
        console.error("Error assigning role:", roleError);
      }

      await interaction.editReply({
        content: `You've been granted a ${hourstime}h trial! Check your DMs for details.`,
        ephemeral: true
      });

    } catch (error) {
      console.error("Error in trial command:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "An error occurred while processing your trial request",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: "An error occurred while processing your trial request",
          ephemeral: true
        });
      }
    }
  }
};