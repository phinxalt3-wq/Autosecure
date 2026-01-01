const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

async function purchasepanel() {
  const msg = {};
  msg.embeds = [
    new EmbedBuilder()
      .setColor(0xADD8E6)
      .setDescription("\n - **Phisher & Autosecure license** - Most trusted in comm \n - **Extra Bot Slot** - Addon to your license, unlock your second bot")
  ];
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("purchaselicense").setLabel("Purchase License").setStyle(1),
    new ButtonBuilder().setCustomId("purchaseslot").setLabel("Purchase Bot Slot [Addon]").setStyle(1)
  );
  msg.components = [row];
  return msg;
}

module.exports = purchasepanel;
