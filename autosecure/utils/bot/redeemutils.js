  const { EmbedBuilder } = require("discord.js");
  const { queryParams } = require("../../../db/database");
  const { notifierWebhook, roleid, guildid } = require("../../../config.json");
  const { autosecurelogs } = require('../embeds/autosecurelogs');
  const access = require("../../../db/access");
  const quicksetupmsg = require('../embeds/quicksetupmsg');



  async function redeemLicense(client, interaction, license, licenseData) {
    let expiry = null;
    let isExtension = false;

    if (licenseData.duration) {
      const daysNum = parseFloat(licenseData.duration);
      if (!isNaN(daysNum) && daysNum > 0) {
        const durationMs = daysNum * 86400000;
        const existingUser = await queryParams("SELECT * FROM usedLicenses WHERE user_id=?", [interaction.user.id]);
        const existingTrial = await queryParams("SELECT * FROM trial WHERE user_id = ?", [interaction.user.id]);

        if (existingTrial.length > 0) {
          await queryParams("UPDATE trial SET trial = ? WHERE user_id = ?", ["true", interaction.user.id]);
        } else {
          await queryParams("INSERT INTO trial (user_id, trial) VALUES (?, ?)", [interaction.user.id, "true"]);
        }

        if (existingUser.length > 0) {
          isExtension = true;
          const currentExpiry = existingUser[0].expiry ? parseInt(existingUser[0].expiry) : Date.now();
          expiry = (currentExpiry + durationMs).toString();
          await queryParams("DELETE FROM usedLicenses WHERE user_id=?", [interaction.user.id]);
        } else {
          expiry = (Date.now() + durationMs).toString();
        }

        await queryParams(
          "INSERT INTO usedLicenses(license, user_id, expiry, one_day_warning_sent, seven_day_warning_sent) VALUES(?, ?, ?, 0, 0)",
          [license, interaction.user.id, expiry]
        );
      }
    }

    const existingAccess = await queryParams("SELECT * FROM autosecure WHERE user_id=?", [interaction.user.id]);
    if (existingAccess.length === 0) {
      await queryParams("INSERT INTO autosecure(user_id) VALUES(?)", [interaction.user.id]);
      await queryParams("INSERT INTO secureconfig(user_id) VALUES(?)", [interaction.user.id]);
    }

    await queryParams("DELETE FROM licenses WHERE license=?", [license]);

    try {
      const guild = await client.guilds.fetch(guildid);
      const member = await guild.members.fetch(interaction.user.id);
      await member.roles.add(roleid);
      console.log(`Role assigned to ${interaction.user.tag}`);
    } catch (roleError) {
      console.error("Role assignment failed:", roleError);
    }

    try {
      const user = await client.users.fetch(interaction.user.id);
      let msg = "";
      if (expiry) {
        msg = `\nYour license expires: <t:${Math.floor(parseInt(expiry) / 1000)}:R>`;
      }


      let expiryTimestamp = `<t:${Math.floor(parseInt(expiry) / 1000)}:R>`



      let newSetup = null;
      const dmEmbed = new EmbedBuilder().setColor('#5f9ea0');
      if (isExtension) {
          dmEmbed
          .setTitle(`**Subscription extended**`)
.setDescription(`

__**Details**__
**Status:** Active
**Expires:** ${expiryTimestamp}
**Access license:** /license`)

          .setFooter({ text: `Powered by Phinxz` })
          .setTimestamp(); 
      } else {
        newSetup = await quicksetupmsg();
          const hasslots = await queryParams(`SELECT * FROM slots WHERE user_id = ?`, [interaction.user.id]);
          if (!hasslots || hasslots.length === 0) {
            await queryParams(`INSERT INTO slots(user_id, slots) VALUES(?, ?)`, [interaction.user.id, 1]);
          }
           dmEmbed
          .setColor(0x5f9ea0)
          .setTitle(`**Subscription activated**`)
          .setDescription(`\n\n__**Details**__\n**Status:** Active\n**Expires:** ${expiryTimestamp}\n**User:** <@${interaction.user.id}>`)
          .setFooter({ text: `Powered by Phinxz ` })
          .setTimestamp();
      }

      await user.send({ embeds: [dmEmbed] });
      if (newSetup) {
        await user.send(newSetup);
      }

      const webhookMessage = isExtension
        ? `<@${interaction.user.id}> extended their access to Auto Secure!${msg}`
        : `<@${interaction.user.id}> claimed access to Auto Secure!${msg}`;
      await autosecurelogs(null, "redeem", interaction.user.id, null, null, null, webhookMessage);

      const replyEmbed = new EmbedBuilder().setColor('#5f9ea0').setDescription(isExtension
        ? `**Your Autosecure subscription has been extended!**\nNew expiration date: <t:${Math.floor(parseInt(expiry) / 1000)}:R>`
        : `**You now own Autosecure!**\nYour license expires on: <t:${Math.floor(parseInt(expiry) / 1000)}:R>`
      );
      await interaction.editReply({ embeds: [replyEmbed] });
    } catch (dmError) {
      console.error("DM failed:", dmError);
      const embed = new EmbedBuilder()
        .setColor('#5f9ea0')
        .setDescription("**Your access has been granted!**\nCould not send you a DM, but you can now use Autosecure. Use /license for your key!");
      await interaction.editReply({ embeds: [embed] });
    }
  }

  async function redeemSlotKey(client, interaction, slotkey) {
    const userId = interaction.user.id;

    await queryParams("DELETE FROM unusedslots WHERE unusedslots = ?", [slotkey]);
    const existing = await queryParams("SELECT * FROM slots WHERE user_id = ?", [userId]);

    if (existing.length > 0) {
      await queryParams("UPDATE slots SET slots = slots + 1 WHERE user_id = ?", [userId]);
    } else {
      await queryParams("INSERT INTO slots(user_id, slots) VALUES(?, ?)", [userId, 1]);
    }

    const updated = await queryParams("SELECT slots FROM slots WHERE user_id = ?", [userId]);
    const currentSlots = updated[0]?.slots || 0;

    const embed = new EmbedBuilder()
      .setColor('#5f9ea0')
      .setDescription("**Slot key successfully redeemed!** You now have an additional bot slot.");

    const dmEmbed = new EmbedBuilder()
      .setColor('#5f9ea0')
      .setDescription("You've redeemed a Lifetime Bot Slot! You can now do /bots and click on the empty slot to set this new bot up!")
      .addFields({ name: "Updated slots", value: `\`\`\`${currentSlots}\`\`\``, inline: false });

    try {
      await interaction.user.send({ embeds: [dmEmbed] });
    } catch (e) {
      console.error("Failed to DM user:", e);
      const fixEmbed = new EmbedBuilder()
        .setColor('#5f9ea0')
        .setDescription("**Slot key successfully redeemed!** Couldn't DM you the instructions, see /guide quick setup.");
      return interaction.editReply({ embeds: [fixEmbed] });
    }

    await interaction.editReply({ embeds: [embed] });
    await autosecurelogs(client, "redeemslot", slotkey, userId, currentSlots, null, null, null);

  }

  module.exports = {
    redeemSlotKey,
    redeemLicense
  }
