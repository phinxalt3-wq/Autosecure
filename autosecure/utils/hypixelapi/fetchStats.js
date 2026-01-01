const getUUID = require('./getUUID');
const axios = require("axios");
const fs = require("fs");
const { queryParams } = require("../../../db/database");
const { haslifetimekey } = require('../../../db/getkey');
const generate = require("../utils/generate");
const fetchStatsSkyblock = require("./fetchStatsSkyblock");

module.exports = async (username) => {
  let key, timefromdbRaw;

  const hasLifetime = await haslifetimekey(); 

  if (hasLifetime) {
    const results2 = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);
    if (results2.length > 0) {
      key = results2[0].apikey;
      timefromdbRaw = results2[0].time;
    }
  } 


  if (!key) {
    const results = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [1]);
    if (results.length > 0) {
      key = results[0].apikey;
      timefromdbRaw = results[0].time;
    }
  }


  if (!key) {
    return 'api';
  }


  let uuid = await getUUID(username);
  if (!uuid) {

    return null;
  }

  let promises = [];
  let stats = {
    social: {},
    duels: {
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      KLRatio: 0,
      title: 0,
      WLRatio: 0,
      totalGamesPlayed: 0,
      coins: 0
    },
    skywars: {
      coins: 0,
      losses: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      kdr: 0,
      wlr: 0,
      assists: 0,
      levels: 0,
    },
    bedwars: {
      coins: 0,
      kills: 0,
      losses: 0,
      wins: 0,
      finalKills: 0,
      finalDeaths: 0,
      fkdr: 0,
      wlr: 0,
      bedsBroken: 0,
      bedsLost: 0,
      bblr: 0,
      level: 0,
    },
    rank: "None",
    skyblock: []
  };
  let player = null;


  let sb = await fetchStatsSkyblock(uuid, key);
  if (sb){
    stats.skyblock = sb
  }
   else {

  }

  let p1 = axios({
    url: `https://api.hypixel.net/player?key=${key}&uuid=${uuid}`,
    method: "get",
  })
  .then((data) => {
    if (data.status === 403) {

      return "api";
    }  
    if (!data?.data?.player) {

      return null;
    }
    player = data.data.player;

    stats.giftedranks = data?.data?.player?.giftingMeta?.ranksGiven || "0";
    
      if (data?.data?.player?.networkExp) {
        let expfixed = parseFloat(data.data.player.networkExp);
        stats.nwl = Math.round(((Math.sqrt(2 * expfixed + 30625) / 50) - 2.5) * 100) / 100;
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });

  promises.push(p1);

  await Promise.all(promises);


  if (!player) {
    return null;
  }

  stats.name = username;

  if (player.rank && player.rank !== "NORMAL") {
    stats.rank = player.rank;
  } else if (player.monthlyPackageRank && player.monthlyPackageRank !== "NONE") {
    stats.rank = "MVP++";
  } else if (player.newPackageRank) {
    let rankName = player.newPackageRank;
    stats.rank = rankName.replace("_PLUS", "+");
  } else {
    stats.rank = "None";
  }


  if (player?.socialMedia?.links?.DISCORD) stats.social.discord = player?.socialMedia?.links?.DISCORD;
  if (player?.socialMedia?.links?.TWITTER) stats.social.twitter = player?.socialMedia?.links?.TWITTER;
  if (player?.socialMedia?.links?.HYPIXEL) stats.social.hypixel = player?.socialMedia?.links?.HYPIXEL;
  if (player?.socialMedia?.links?.YOUTUBE) stats.social.youtube = player?.socialMedia?.links?.YOUTUBE;

  if (player?.stats?.Duels) {
    stats.duels.wins = player?.stats?.Duels?.wins;
    stats.duels.losses = player?.stats?.Duels?.losses;
    stats.duels.kills = player?.stats?.Duels?.kills;
    stats.duels.deaths = player?.stats?.Duels?.deaths;
    stats.duels.KLRatio = calculateRatio(stats.duels.kills, stats.duels.deaths);
    stats.duels.title = getDuelsTitle(stats.duels.wins);
    stats.duels.WLRatio = calculateRatio(stats.duels.wins, stats.duels.losses);
    stats.duels.totalGamesPlayed = (player?.stats?.Duels?.games_played_duels);
    stats.duels.coins = player?.stats?.Duels?.coins;
}


  if (player?.stats?.SkyWars) {
    stats.skywars.coins = player?.stats?.SkyWars?.coins;
    stats.skywars.losses = player?.stats?.SkyWars?.losses;
    stats.skywars.wins = player?.stats?.SkyWars?.wins;
    stats.skywars.kills = player?.stats?.SkyWars?.kills;
    stats.skywars.deaths = player?.stats?.SkyWars?.deaths;
    stats.skywars.kdr = calculateRatio(stats.skywars.kills, stats.skywars.deaths);
    stats.skywars.wlr = calculateRatio(stats.skywars.wins, stats.skywars.losses);
    stats.skywars.assists = player?.stats?.SkyWars?.assists;
    stats.skywars.levels = getSWLevel(player?.stats?.SkyWars?.skywars_experience);
  }




  if (player?.stats?.Bedwars) {
    stats.bedwars.coins = player?.stats?.Bedwars?.coins;
    stats.bedwars.kills = player?.stats?.Bedwars?.kills_bedwars || 0;
    stats.bedwars.losses = player?.stats?.Bedwars?.losses_bedwars;
    stats.bedwars.wins = player?.stats?.Bedwars?.wins_bedwars;
    stats.bedwars.finalKills = player?.stats?.Bedwars?.final_kills_bedwars;
    stats.bedwars.finalDeaths = player?.stats?.Bedwars?.final_deaths_bedwars;
    stats.bedwars.fkdr = calculateRatio(stats.bedwars.finalKills, stats.bedwars.finalDeaths);
    stats.bedwars.wlr = calculateRatio(stats.bedwars.wins, stats.bedwars.losses);
    stats.bedwars.bedsBroken = player?.stats?.Bedwars?.beds_broken_bedwars;
    stats.bedwars.bedsLost = player?.stats?.Bedwars?.beds_lost_bedwars;
    stats.bedwars.bblr = calculateRatio(stats.bedwars.bedsBroken, stats.bedwars.bedsLost);
    stats.bedwars.level = (player?.achievements?.bedwars_level);
  }


  let id = generate(32);
  await queryParams(`INSERT INTO skyblock_stats(id,data) VALUES(?,?)`, [id, JSON.stringify(stats)]);
  return id;
};


function getDuelsTitle(wins) {
  if (wins >= 56000) return "Godlike X";
  else if (wins >= 52000) return "Godlike IX";
  else if (wins >= 48000) return "Godlike VIII";
  else if (wins >= 44000) return "Godlike VII";
  else if (wins >= 40000) return "Godlike VI";
  else if (wins >= 36000) return "Godlike V";
  else if (wins >= 32000) return "Godlike IV";
  else if (wins >= 28000) return "Godlike III";
  else if (wins >= 24000) return "Godlike II";
  else if (wins >= 20000) return "Godlike";
  else if (wins >= 18000) return "Grandmaster V";
  else if (wins >= 16000) return "Grandmaster IV";
  else if (wins >= 14000) return "Grandmaster III";
  else if (wins >= 12000) return "Grandmaster II";
  else if (wins >= 10000) return "Grandmaster";
  else if (wins >= 8800) return "Legend V";
  else if (wins >= 7600) return "Legend IV";
  else if (wins >= 6400) return "Legend III";
  else if (wins >= 5200) return "Legend II";
  else if (wins >= 4000) return "Legend";
  else if (wins >= 3800) return "Master V";
  else if (wins >= 3200) return "Master IV";
  else if (wins >= 2800) return "Master III";
  else if (wins >= 2400) return "Master II";
  else if (wins >= 2000) return "Master";
  else if (wins >= 1800) return "Diamond V";
  else if (wins >= 1600) return "Diamond IV";
  else if (wins >= 1400) return "Diamond III";
  else if (wins >= 1200) return "Diamond II";
  else if (wins >= 1000) return "Diamond";
  else if (wins >= 900) return "Gold V";
  else if (wins >= 800) return "Gold IV";
  else if (wins >= 700) return "Gold III";
  else if (wins >= 600) return "Gold II";
  else if (wins >= 500) return "Gold";
  else if (wins >= 440) return "Iron V";
  else if (wins >= 380) return "Iron IV";
  else if (wins >= 320) return "Iron III";
  else if (wins >= 260) return "Iron II";
  else if (wins >= 200) return "Iron";
  else if (wins >= 180) return "Rookie V";
  else if (wins >= 160) return "Rookie IV";
  else if (wins >= 140) return "Rookie III";
  else if (wins >= 120) return "Rookie II";
  else if (wins >= 100) return "Rookie";
  else return "No Rank";
}

function calculateRatio(wins, losses) {
  if (losses === 0) {
    return wins === 0 ? "N/A" : "Infinity";
  } else {
    return Math.round((wins / losses) * 100) / 100;
  }
}

function getSWLevel(xp) {
  const totalXp = [20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000];
  let exactLevel = 0;

  if (xp >= 15000) {
    exactLevel = (xp - 15000) / 10000 + 12;
  } else {
    let c = 0;
    while (xp >= 0 && c < totalXp.length) {
      if (xp - totalXp[c] >= 0) {
        c++;
      } else {
        exactLevel =
          c + 1 + (xp - totalXp[c - 1]) / (totalXp[c] - totalXp[c - 1]);
        break;
      }
    }
  }
  return exactLevel;
}

