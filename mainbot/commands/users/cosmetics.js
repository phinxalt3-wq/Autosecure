const { getlunar } = require("../../../autosecure/utils/lunarapi/src/index");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const {
    getCosmeticNameById,
    getEmoteNameById
} = require("../../../store/assetsloader");

function formatWithId(name, id) {
    return `${name} (ID: ${id})`;
}

function filterKnownWithId(items, getName) {
    return items
        .map(item => {
            const id = typeof item === "object" ? item.cosmeticId || item.id || null : item;
            if (!id) return null;
            const name = getName(id);
            if (!name) return null;
            return formatWithId(name, id);
        })
        .filter(Boolean);
}

module.exports = {
  name: "cosmetics",
  description: "Get lunar cosmetics by SSID",
  options: [
    {
      name: "ssid",
      description: "The SSID to check",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  userOnly: true,
  callback: async (client, interaction) => {
    const ssid = interaction.options.getString("ssid");
    await interaction.deferReply({
      ephemeral: true
    })
    const d = await getlunar(ssid);
    if (!d) {
      return interaction.editReply({
        content: `Invalid SSID/Couldn't authenticate with Lunar!`,
        ephemeral: true
      });
    }
    

    console.log(d)

    const [cosmeticRaw, emoteRaw] = JSON.parse(d);
    const now = new Date();

    const allcosmetics = filterKnownWithId(
      cosmeticRaw.ownedCosmetics.filter(c => !c.expiresAt || new Date(c.expiresAt) > now),
      getCosmeticNameById
    );

    const equippedcosmetics = filterKnownWithId(
      cosmeticRaw.settings.equippedCosmetics || [],
      getCosmeticNameById
    );

    const lunarfreecosmetics = filterKnownWithId(
      cosmeticRaw.lunarPlusFreeCosmeticIds || [],
      getCosmeticNameById
    );

    const allemotes = filterKnownWithId(
      emoteRaw.ownedEmoteIds || [],
      getEmoteNameById
    );

    const equippedemotes = filterKnownWithId(
      emoteRaw.equippedEmoteIds || [],
      getEmoteNameById
    );

    const lunarrank = cosmeticRaw.rankName || "None";

    function formatList(arr) {
      return arr.length > 0 ? arr.join("\n") : "None";
    }

    const description = 
`**Lunar Rank**
\`\`\`
${lunarrank}
\`\`\`

**All Cosmetics**
\`\`\`
${formatList(allcosmetics)}
\`\`\`

**Equipped Cosmetics**
\`\`\`
${formatList(equippedcosmetics)}
\`\`\`

**All Emotes**
\`\`\`
${formatList(allemotes)}
\`\`\`

**Equipped Emotes**
\`\`\`
${formatList(equippedemotes)}
\`\`\`
`;

    const embed = new EmbedBuilder()
      .setTitle("Lunar Cosmetics Info")
      .setDescription(description)
      .setColor(0xADD8E6);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
};
