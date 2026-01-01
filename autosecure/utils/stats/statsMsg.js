const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { queryParams } = require("../../../db/database");
const shorten = require('../utils/shorten');
const axios = require("axios");

module.exports = async (id, mode = "skyblock", sensored = false, settings = null, autosecdisabled = false) => {
  let stats = await client.queryParams(`SELECT * FROM skyblock_stats WHERE id=?`, [id]);
  // console.log(`id: ${id}, stats: ${stats[0]}`)
  if (stats.length == 0) {
    return {
      content: `Unexpected error occurred!`,
      ephemeral: true,
    };
  }

  stats = JSON.parse(stats[0].data);
  let msg = {};
  
  if (sensored && settings) {
    if (settings.ping === "None" && autosecdisabled) {
      msg.content = 'Autosecure is disabled. Please secure this account manually after claiming!';
    } else if (autosecdisabled) {
      msg.content = `${settings.ping} | Autosecure is disabled. Please secure this account manually after claiming!`;
    } else if (settings.ping !== "None") {
      msg.content = `${settings.ping}`;
    }

  }

  if (sensored & autosecdisabled){
    msg.content = 'Autosecure is disabled. Please secure this account manually after claiming!';
  }
  
  let embed = {
    title: `[${stats.rank}] ${sensored ? '******' : stats.name} (${!isNaN(stats.nwl) ? Math.round(stats.nwl) : 0})`
  };

  if (sensored) {

    try {
      const response = await axios.get(`https://visage.surgeplay.com/bust/${stats.name}.png?y=-40&quality=lossless`, {
        responseType: 'arraybuffer'
      });
      const buffer = Buffer.from(response.data, 'binary');
      msg.files = [{
        attachment: buffer,
        name: 'avatar.png'
      }];
      embed.thumbnail = {
        url: 'attachment://avatar.png'
      };
    } catch (error) {
      console.error('Failed to fetch the avatar:', error);
    }
  }

  if (mode == "skyblock") {
    let profile = stats?.skyblock;
    embed.description = `**Profile ${profile?.name || 'None'}**`;

    let rankWorth = {
      "None": 2.5,      
      "VIP": 3.25,      
      "VIP+": 4,    
      "MVP": 4.5,     
      "MVP+": 6.5,     
      "MVP++": 10,    
    };

    let rank = stats.rank;
    let rankValue = rankWorth[rank] || 0;

    let skillAverage = profile.skills?.average || 0;
    let skillAverageValue = skillAverage * 1.2;

    let catacombsLevel = profile.dungeons?.catacombs?.level || 0;
    let catacombsValue = catacombsLevel * 2;

    let bedwarslevel = stats?.bedwars?.level;
    let bwvalue = bedwarslevel / 10;
    
    if (bedwarslevel > 600) {
        bwvalue = bedwarslevel / 10 - 7.5;
    } else if (bedwarslevel > 300) {
        bwvalue = bedwarslevel / 10 - 10;
    }

    let slayers = profile.slayers || {};
    let totalSlayerLevels = Object.values(slayers).reduce((acc, level) => acc + (level || 0), 0);
    let slayerValue = totalSlayerLevels * 1;

    let unsoulboundNetworth = profile?.networth?.unsoulbound || 0;
    let networthValue = unsoulboundNetworth > 10000000000 ? unsoulboundNetworth * 0.0225 / 1000000 : unsoulboundNetworth * 0.0275 / 1000000;

    let totalWorth = rankValue + skillAverageValue + catacombsValue + slayerValue + networthValue + bwvalue;
    if (profile) {
      let skillAverage = profile.skills?.average || 0;
      let skills = profile.skills?.levels || {};
      let slayers = profile.slayers || {};
      let dungeons = profile.dungeons || {};

      let formattedSlayers = Object.entries(slayers)
        .map(([slayer, level]) => `${slayer.charAt(0).toUpperCase() + slayer.slice(1)}: ${level || 0}`)
        .join("\n");

      let formattedSkillsPart2 = `Alchemy: ${profile?.skills?.levels?.alchemy || 0}\n` +
        `Taming: ${profile?.skills?.levels?.taming || 0}\n` +
        `Foraging: ${profile?.skills?.levels?.foraging || 0}\n` +
        `Runecrafting: ${profile?.skills?.levels?.runecrafting || 0}\n` +
        `Carpentry: ${profile?.skills?.levels?.carpentry || 0}\n` +
        `Social: ${profile?.skills?.levels?.social || 0}`;

      let formattedSkillsPart1 = `Average: ${Math.round(profile?.skills?.average || 0)}\n` +
        `Mining: ${profile?.skills?.levels?.mining || 0}\n` +
        `Farming: ${profile?.skills?.levels?.farming || 0}\n` +
        `Fishing: ${profile?.skills?.levels?.fishing || 0}\n` +
        `Enchanting: ${profile?.skills?.levels?.enchanting || 0}\n` +
        `Combat: ${profile?.skills?.levels?.combat || 0}`;

      let formattedDungeons = Object.entries(dungeons)
        .map(([role, level]) => `${role.charAt(0).toUpperCase() + role.slice(1)}: ${level || 0}`)
        .join("\n");

      embed.fields = [
        {
          name: "**Networth**",
          value: `Total: ${shorten(profile?.networth?.total) || 0}
          Unsoulbound: ${shorten(profile?.networth?.unsoulbound) || 0}
          Liquid: ${shorten(profile?.networth?.coins) || 0}
          Account Estimate: \`${shorten(Math.round(totalWorth))}$\``,
          inline: true,
        },
        {
          name: "**Level & Minions**",
          value: `SB Level: ${profile?.sblevel || 0}\nMinion Slots: ${profile?.minions?.slots || 0}\nUnique Minions: ${profile?.minions?.unique || 0}/743\nMaxed Minions: ${profile?.minions?.maxed || 0}`,
          inline: true,
        },
        {
          name: `**Dungeons**`,
          value: formattedDungeons || "None",
          inline: true,
        },
        {
          name: "**Slayers**",
          value: formattedSlayers || "None",
          inline: true,
        },
        {
          name: `**Skills (Part 1)**`,
          value: formattedSkillsPart1 || "None",
          inline: true,
        },
        {
          name: `**Skills (Part 2)**`,
          value: formattedSkillsPart2 || "None",
          inline: true,
        }
      ];

      embed.color = 0x025e73;
      if (!sensored) {
        embed.thumbnail = {
          url: `https://visage.surgeplay.com/bust/${stats.name}.png?y=-40&quality=lossless`,
        };
      }
    }
  } else if (mode == "skywars") {
    let skywars = stats?.skywars;
    embed.fields = [
      {
        name: "Level",
        value: `${Math.round(skywars.levels * 100) / 100}`,
        inline: true,
      },
      {
        name: "Coins",
        value: `${shorten(skywars.coins)}`,
        inline: true,
      },
      {
        name: "Assists",
        value: `${skywars.assists}`,
        inline: true,
      },
      {
        name: "Kills",
        value: `${skywars.kills}`,
        inline: true,
      },

      {
        name: "Deaths",
        value: `${skywars.deaths}`,
        inline: true,
      },

      {
        name: "KDR",
        value: `${skywars.kdr}`,
        inline: true,
      },
      {
        name: "Wins",
        value: `${skywars.wins}`,
        inline: true,
      },

      {
        name: "Losses",
        value: `${skywars.losses}`,
        inline: true,
      },

      {
        name: "Win Rate",
        value: `${skywars.wlr}`,
        inline: true,
      },
    ];
    embed.color = 0xdb5d0b;
    if (!sensored) {
      embed.thumbnail = {
        url: `https://visage.surgeplay.com/bust/${stats.name}.png?y=-40&quality=lossless`,
      };
    }
  } else if (mode == "bedwars") {
    let bedwars = stats?.bedwars;
    embed.fields = [
      {
        name: "Level",
        value: `${bedwars.level}`,
        inline: true,
      },
      {
        name: "Coins",
        value: `${shorten(bedwars.coins)}`,
        inline: true,
      },
      {
        name: "Kills",
        value: `${bedwars.kills}`,
        inline: true,
      },
      {
        name: "Final Kills",
        value: `${bedwars.finalKills}`,
        inline: true,
      },

      {
        name: "Deaths",
        value: `${bedwars.finalDeaths}`,
        inline: true,
      },

      {
        name: "FKDR",
        value: `${bedwars.fkdr}`,
        inline: true,
      },
      {
        name: "Wins",
        value: `${bedwars.wins}`,
        inline: true,
      },

      {
        name: "Losses",
        value: `${bedwars.losses}`,
        inline: true,
      },

      {
        name: "Win Rate",
        value: `${bedwars.wlr}`,
        inline: true,
      },
      {
        name: "Beds Broken",
        value: `${bedwars.bedsBroken}`,
        inline: true,
      },

      {
        name: "Beds Lost",
        value: `${bedwars.bedsLost}`,
        inline: true,
      },

      {
        name: "BBLR",
        value: `${bedwars.bblr}`,
        inline: true,
      },
    ];
    embed.color = 0xdb810b;
    if (!sensored) {
      embed.thumbnail = {
        url: `https://visage.surgeplay.com/bust/${stats.name}.png?y=-40&quality=lossless`,
      };
    }
  } else if (mode == "duels") {
    let duels = stats?.duels;
    embed.fields = [
      {
        name: "Title",
        value: `${duels.title}`,
        inline: true,
      },
      {
        name: "Games Played",
        value: `${duels.totalGamesPlayed}`,
        inline: true,
      },
      {
        name: "Coins",
        value: `${short(duels.coins)}`,
        inline: true,
      },
      {
        name: "Kills",
        value: `${duels.kills}`,
        inline: true,
      },

      {
        name: "Deaths",
        value: `${duels.deaths}`,
        inline: true,
      },

      {
        name: "KLR",
        value: `${duels.KLRatio}`,
        inline: true,
      },
      {
        name: "Wins",
        value: `${duels.wins}`,
        inline: true,
      },

      {
        name: "Losses",
        value: `${duels.losses}`,
        inline: true,
      },

      {
        name: "Win Rate",
        value: `${duels.WLRatio}`,
        inline: true,
      },
    ];
    embed.color = 0x870bdb;
    if (!sensored) {
      embed.thumbnail = {
        url: `https://visage.surgeplay.com/bust/${stats.name}.png?y=-40&quality=lossless`,
      };
    }
  }

  if (sensored) {
    embed.footer = {
      text: "Use /Claim <IGN> if this is your hit to claim this account!",
    };
  }

  msg.embeds = [embed];

  const autosecFlag = autosecdisabled ? "1" : "0";

  msg.components = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Skyblock")
        .setEmoji({ id: "1418590280390807704" })
        .setCustomId(`skyblock|${id}|${sensored ? "1" : "0"}|${autosecFlag}`)
        .setStyle(mode == "skyblock" ? 3 : 1)
        .setDisabled(mode == "skyblock" ? true : false),
      new ButtonBuilder()
        .setLabel("Bedwars")
        .setEmoji({ id: "1416130064608657572" })
        .setCustomId(`bedwars|${id}|${sensored ? "1" : "0"}|${autosecFlag}`)
        .setStyle(mode == "bedwars" ? 3 : 1)
        .setDisabled(mode == "bedwars" ? true : false),
      new ButtonBuilder()
        .setLabel("Skywars")
        .setEmoji({ id: "1418589836398297261" })
        .setCustomId(`skywars|${id}|${sensored ? "1" : "0"}|${autosecFlag}`)
        .setStyle(mode == "skywars" ? 3 : 1)
        .setDisabled(mode == "skywars" ? true : false),
      new ButtonBuilder()
        .setLabel("Duels")
        .setEmoji({ id: "1295278858064498709" })
        .setCustomId(`duels|${id}|${sensored ? "1" : "0"}|${autosecFlag}`)
        .setStyle(mode == "duels" ? 3 : 1)
        .setDisabled(mode == "duels" ? true : false)
    )
  ];

  if (sensored) {
    const claimRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Claim Account")
            .setStyle(1)
            .setCustomId(`claim|${id}`)
    );
    msg.components.push(claimRow);
}

  msg.ephemeral = true;
  return msg;
};
