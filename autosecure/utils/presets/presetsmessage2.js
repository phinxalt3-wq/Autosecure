const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder 
} = require("discord.js");
const getPreset = require("../responses/getPreset");


module.exports = async function presetsmessage2(name, ownerid, botnumber, number) {
  let presetData = await getPreset(ownerid, botnumber, name);
 // console.log(`ownerid: ${ownerid} && ${botnumber} && ${name}`)

  let embed;
  if (!presetData) {
    embed = new EmbedBuilder().setTitle(`Preset ${name}`);
  } else {
    try {
      const embedJson = JSON.parse(presetData);
      embed = Array.isArray(embedJson.embeds) ? embedJson.embeds[0] : embedJson;
      embed = EmbedBuilder.from(embed); 
    } catch (e) {
      embed = new EmbedBuilder().setTitle(`Preset ${name} (Invalid JSON)`);
    }
  }

  const loadEmbed = new ButtonBuilder().setCustomId(`loadembed|${name}|${ownerid}|${botnumber}`).setLabel("Load Embed").setStyle(ButtonStyle.Primary);
  const saveEmbed = new ButtonBuilder().setCustomId(`savepreset|${name}|${ownerid}|${botnumber}|${number}`).setLabel("Save Embed").setStyle(ButtonStyle.Success);
  const resetEmbed = new ButtonBuilder().setCustomId(`deletepreset|${name}|${ownerid}|${botnumber}`).setLabel("Reset Embed").setStyle(ButtonStyle.Danger);
  const exportEmbed = new ButtonBuilder().setCustomId("exportjson").setLabel("Export Embed").setStyle(ButtonStyle.Secondary);
  const placeholders = new ButtonBuilder().setCustomId(`placeholders|${name}`).setLabel("Placeholders").setStyle(ButtonStyle.Secondary);
  const basicEditor = new ButtonBuilder().setCustomId(`basiceditor|${name}|${ownerid}|${botnumber}`).setLabel("Basic Editor").setStyle(ButtonStyle.Secondary);

  const components = [
    new ActionRowBuilder().addComponents(loadEmbed, saveEmbed, resetEmbed, exportEmbed, placeholders),
    new ActionRowBuilder().addComponents(basicEditor)
  ];

  return {
    embeds: [embed],
    components: components,
    ephemeral: true
  };
};
