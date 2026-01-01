const axios = require("axios");
const { getHypixelApiKey } = require("../../../db/getkey");
const { getNetworth } = require("skyhelper-networth");
const hotmCalc = require("./hotmCalc");
const checkIfUserIsOnline = require('../secure/onlinestatus');
const getUUID = require('./getUUID');
const { getNAME } = require("./getNAME");

// Dungeoneering XP table (Catacombs)
const DUNGEONEERING_XP = {
    1: 50,
    2: 75,
    3: 110,
    4: 160,
    5: 230,
    6: 330,
    7: 470,
    8: 670,
    9: 950,
    10: 1340,
    11: 1890,
    12: 2665,
    13: 3760,
    14: 5260,
    15: 7380,
    16: 10300,
    17: 14400,
    18: 20000,
    19: 27600,
    20: 38000,
    21: 52500,
    22: 71500,
    23: 97000,
    24: 132000,
    25: 180000,
    26: 243000,
    27: 328000,
    28: 445000,
    29: 600000,
    30: 800000,
    31: 1065000,
    32: 1410000,
    33: 1900000,
    34: 2500000,
    35: 3300000,
    36: 4300000,
    37: 5600000,
    38: 7200000,
    39: 9200000,
    40: 12000000,
    41: 15000000,
    42: 19000000,
    43: 24000000,
    44: 30000000,
    45: 38000000,
    46: 48000000,
    47: 60000000,
    48: 75000000,
    49: 93000000,
    50: 116250000,
    51: 200000000
};

// Skill caps
const maxLvL = {
    Fishing: 50,
    Mining: 60,
    Combat: 60,
    Foraging: 50,
    Taming: 51,
    Enchanting: 60,
    Alchemy: 50,
    Carpentry: 50,
    Runecrafting: 25,
    Social: 25,
};

module.exports = async (ign) => {
 //   console.log('Getting data!');
    const hypixelApiKey = await getHypixelApiKey();
 //   console.log(`Got apikey: ${hypixelApiKey}`);

    let stats = {
        online: {
            status: false,
            game: null
        },
        social: {},
        skyblock: [],
        duels: {
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            KLRatio: 0,
            title: 0,
            WLRatio: 0,
            bestWinStreak: 0,
            currentWinStreak: 0,
        },
        skywars: {
            coins: 0,
            winstreak: 0,
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
            winstreak: 0,
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
        nwl: "0",
        hasapi: true

    };
    let uuid = null;

    try {
        uuid = await getUUID(ign);
    //    console.log(`Stats UUID: ${uuid}`);
    } catch (e) {
        return stats;
    }
    if (!uuid) return stats;

    let t = null;
    let player, profiles = null;

    // Helper function for retry logic
    const retryPromise = async (fn, maxRetries = 3, delayMs = 1000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    };

    let p1 = retryPromise(async () => {
        return axios({
            url: `https://api.hypixel.net/v2/player?key=${hypixelApiKey}&uuid=${uuid}`,
            method: "get",
            maxRedirects: 0,
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 510,
        }).then((data) => {
            if (data?.data?.player) {
                t = data.data;
                player = data.data.player;
                stats.giftedranks = data?.data?.player?.giftingMeta?.ranksGiven || "0";
                if (player.networkExp) {
                    let expfixed = parseFloat(player.networkExp);
                    stats.nwl = Math.round(((Math.sqrt(2 * expfixed + 30625) / 50) - 2.5) * 100) / 100;
                }
            } else {
                // Almost certain it's invalid api key!
                stats.hasapi = false;
            }
        });
    }, 3, 500).catch(error => {
        console.error(`[getData] Failed to fetch player data for ${ign}:`, error.message);
        stats.hasapi = false;
    });

    let p2 = retryPromise(async () => {
        return axios({
            url: `https://api.hypixel.net/v2/skyblock/profiles?key=${hypixelApiKey}&uuid=${uuid}`,
            method: "GET",
            maxRedirects: 0,
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 510,
        }).then((data) => {
            if (data?.data?.profiles) {
                profiles = data.data.profiles;
            }
        });
    }, 3, 500).catch(error => {
        console.error(`[getData] Failed to fetch skyblock profiles for ${ign}:`, error.message);
    });

    let p3 = retryPromise(async () => {
        return checkIfUserIsOnline(uuid).then((isOnline) => {
            if (isOnline.online) {
                stats.online.status = true;
                if (isOnline.game && isOnline.mode) {
                    stats.online.game = `${isOnline.game}, ${isOnline.mode}`;
                } else {
                    stats.online.game = "Game not found.";
                }
            }
        });
    }, 2, 500).catch(error => {
        console.error(`[getData] Failed to check online status for ${ign}:`, error.message);
    });

    await Promise.allSettled([p1, p2, p3]);

    if (profiles) {
        for (let profile of profiles) {
            let profStat = {
                profile_id: profile.profile_id,
                catacombs: {
                    archer: 0,
                    mage: 0,
                    berserk: 0,
                    tank: 0,
                    healer: 0,
                    level: 0,
                },
                skills: {
                    Fishing: 0,
                    Mining: 0,
                    Combat: 0,
                    Foraging: 0,
                    Taming: 0,
                    Enchanting: 0,
                    Alchemy: 0,
                    Carpentry: 0,
                    Runecrafting: 0,
                    Social: 0,
                    avg: 0,
                },
                mining: {
                    hptm: 0,
                    gemstonePowder: 0,
                    mithrilPowder: 0,
                    glacite: 0
                },
                slayers: {
                    zombie: 0,
                    spider: 0,
                    wolf: 0,
                    enderman: 0,
                    blaze: 0,
                    vampire: 0,
                },
                bank: 0,
                purse: 0,
                liquid: 0,
                members: []
            };
            
            profStat.memberCount = Object.keys(profile.members).length;
            profStat.current = profile.selected;
            profStat.name = profile.cute_name;
            profStat.gameMode = profile.game_mode ? profile.game_mode : "Normal";
            
            const isCoop = profStat.memberCount > 1;
            let profileCreator = null;

            for (const [memberUuid, memberData] of Object.entries(profile.members)) {
                const coopInvitation = memberData.profile?.coop_invitation || {};
                if (coopInvitation.invited_by === memberUuid.replace(/-/g, "")) {
                    profileCreator = memberUuid;
                    break;
                }
            }

            for (const [memberUuid, memberData] of Object.entries(profile.members)) {
                const memberProfile = memberData.profile || {};
                const coopInvitation = memberProfile.coop_invitation || {};
                
                const isCreator = memberUuid === profileCreator;
                const isSelf = memberUuid === uuid.replace(/-/g, "");
                const isKickable = isCoop && !isCreator && !isSelf && coopInvitation.confirmed;

                profStat.members.push({
                    uuid: memberUuid,
                    name: (await getNAME(memberUuid)), 
                    joined: memberProfile.first_join ? new Date(memberProfile.first_join) : null,
                    invited_by: coopInvitation.invited_by || null,
                    kickable: isKickable
                });
            }

            if (profile?.banking) {
                profStat.bank = Math.round(profile.banking.balance);
            }
            
            let member = profile.members[uuid];
            if (member?.currencies?.coin_purse) {
                profStat.purse = Math.round(member.currencies.coin_purse);
            }
            profStat.liquid = profStat.purse + profStat.bank;
            
            try {
                let networth = await getNetworth(member, profStat.bank, {
                    v2Endpoint: true
                });
                profStat.networth = Math.round(networth.networth * 100) / 100;
                profStat.unsoulboundNetworth = Math.round(networth.unsoulboundNetworth * 100) / 100;
            } catch (e) { }
            
            if (member?.dungeons?.player_classes) {
                for (let [name, xp] of Object.entries(member?.dungeons?.player_classes)) {
                    profStat.catacombs[name] = cataXPCalculator(Math.round(xp.experience));
                }
            }
            
            if (member?.slayer?.slayer_bosses) {
                for (let [key, val] of Object.entries(member?.slayer?.slayer_bosses)) {
                    try {
                        let v = Object.keys(val?.claimed_levels).length;
                        if (v > 9) v = 9;
                        profStat.slayers[key] = v;
                    } catch (e) {
                        profStat.slayers[key] = 0;
                    }
                }
            }
            
            if (member?.mining_core) {
                profStat.mining.mithrilPowder = 
                    (member.mining_core.powder_spent_mithril || 0) + 
                    (member.mining_core.powder_mithril_total || 0);

                profStat.mining.gemstonePowder = 
                    (member.mining_core.powder_spent_gemstone || 0) + 
                    (member.mining_core.powder_gemstone_total || 0);

                profStat.mining.glacite = 
                    (member.mining_core.powder_spent_glacite || 0) + 
                    (member.mining_core.powder_glacite_total || 0);

                profStat.mining.hotm = member.mining_core.experience 
                    ? hotmCalc(member.mining_core.experience) 
                    : 0;
            } else {
                profStat.mining = {
                    hotm: 0,
                    mithrilPowder: 0,
                    gemstonePowder: 0,
                    glacite: 0
                };
            }
            
            if (member?.player_data?.experience) {
                let total = 0;
                for (let [name, xp] of Object.entries(member?.player_data?.experience)) {
                    name = name.replace("SKILL_", "").toLowerCase();
                    name = name.charAt(0).toUpperCase() + name.slice(1);

                    profStat.skills[name] = skillLevelCalculator(
                        Math.round(xp),
                        maxLvL[name]
                    );
                    if (name == "Runecrafting" || name == "Social") continue;
                    total += profStat.skills[name];
                }
                profStat.skills.avg = (total / 9).toFixed(2);
            }
            
            if (member?.dungeons?.dungeon_types?.catacombs?.experience) {
                profStat.catacombs.level = cataXPCalculator(
                    member?.dungeons?.dungeon_types?.catacombs?.experience
                );
            }
            
            profStat.craftedMinions = 0;
            profStat.bonusMinions = 0;

            for (let prof of Object.values(profile?.members)) {
                if (prof?.player_data?.crafted_generators) {
                    profStat.craftedMinions +=
                        prof?.player_data?.crafted_generators.length;
                }
            }

            if (member?.leveling?.completed_tasks) {
                for (let task of member?.leveling?.completed_tasks) {
                    if (task.includes("UPGRADE_MINION_SLOTS")) {
                        profStat.bonusMinions++;
                    }
                }
            }
            if (profStat.bonusMinions > 5) profStat.bonusMinions = 5;

            profStat.levels = member?.leveling?.experience
                ? (member?.leveling?.experience / 100).toFixed(2)
                : 0;
            profStat.minionSlots = 5;
            profStat.minionSlots += profStat.bonusMinions;
            if (profStat?.craftedMinions) {
                profStat.minionSlots += minionSlots(profStat.craftedMinions);
            }

            stats.skyblock.push(profStat);
        }
    }

    stats.name = ign;
    stats.color = player?.rankPlusColor || "null";
    if (player?.rank && player?.rank != "NORMAL") {
        stats.rank = player?.rank;
    } else if (
        player?.monthlyPackageRank &&
        player?.monthlyPackageRank !== "NONE"
    ) {
        stats.rank = "MVP++";
    } else if (player?.newPackageRank) {
        let rankName = player?.newPackageRank;
        stats.rank = rankName?.replace("_PLUS", "+");
    } else {
        stats.rank = "None";
    }

    if (player?.socialMedia?.links?.DISCORD) {
        stats.social.discord = player?.socialMedia?.links?.DISCORD || "None";
    }

    if (player?.socialMedia?.links?.TWITTER) {
        stats.social.twitter = player?.socialMedia?.links?.TWITTER || "None";
    }

    if (player?.socialMedia?.links?.HYPIXEL) {
        stats.social.hypixel = player?.socialMedia?.links?.HYPIXEL || "None";
    }

    if (player?.socialMedia?.links?.YOUTUBE) {
        stats.social.youtube = player?.socialMedia?.links?.YOUTUBE || "None";
    }

    if (player?.stats?.Duels) {
        stats.duels.wins = player?.stats?.Duels?.wins || 0;
        stats.duels.losses = player?.stats?.Duels?.losses || 0;
        stats.duels.kills = player?.stats?.Duels?.kills || 0;
        stats.duels.deaths = player?.stats?.Duels?.deaths || 0;
        stats.duels.KLRatio = calculateRatio(stats.duels.kills, stats.duels.deaths);
        stats.duels.title = getDuelsTitle(stats.duels.wins);
        stats.duels.WLRatio = calculateRatio(stats.duels.wins, stats.duels.losses);
        stats.duels.bestWinStreak = player?.stats?.Duels?.best_all_modes_winstreak || 0;
        stats.duels.totalGamesPlayed = player?.stats?.Duels?.games_played_duels || 0;
        stats.duels.coins = player?.stats?.Duels?.coins || 0;
    }

    if (player?.stats?.SkyWars) {
        stats.skywars.coins = player?.stats?.SkyWars?.coins || 0;
        stats.skywars.winstreak = player?.stats?.SkyWars?.win_streak || 0;
        stats.skywars.losses = player?.stats?.SkyWars?.losses || 0;
        stats.skywars.wins = player?.stats?.SkyWars?.wins || 0;
        stats.skywars.kills = player?.stats?.SkyWars?.kills || 0;
        stats.skywars.deaths = player?.stats?.SkyWars?.deaths || 0;
        stats.skywars.kdr = calculateRatio(stats.skywars.kills, stats.skywars.deaths);
        stats.skywars.wlr = calculateRatio(stats.skywars.wins, stats.skywars.losses);
        stats.skywars.assists = player?.stats?.SkyWars?.assists || 0;
        stats.skywars.levels = getSWLevel(player?.stats?.SkyWars?.skywars_experience);
    }

    if (player?.stats?.Bedwars) {
        stats.bedwars.kills = player?.stats?.Bedwars?.kills_bedwars || 0;
        stats.bedwars.coins = player?.stats?.Bedwars?.coins || 0;
        stats.bedwars.winstreak = player?.stats?.Bedwars?.winstreak || 0;
        stats.bedwars.losses = player?.stats?.Bedwars?.losses_bedwars || 0;
        stats.bedwars.wins = player?.stats?.Bedwars?.wins_bedwars || 0;
        stats.bedwars.finalKills = player?.stats?.Bedwars?.final_kills_bedwars || 0;
        stats.bedwars.finalDeaths = player?.stats?.Bedwars?.final_deaths_bedwars || 0;
        stats.bedwars.fkdr = calculateRatio(stats.bedwars.finalKills, stats.bedwars.finalDeaths);
        stats.bedwars.wlr = calculateRatio(stats.bedwars.wins, stats.bedwars.losses);
        stats.bedwars.bedsBroken = player?.stats?.Bedwars?.beds_broken_bedwars || 0;
        stats.bedwars.bedsLost = player?.stats?.Bedwars?.beds_lost_bedwars || 0;
        stats.bedwars.bblr = calculateRatio(stats?.bedwars?.bedsBroken, stats?.bedwars?.bedsLost);
        stats.bedwars.level = getBedwarsLevel(player?.stats?.Bedwars?.Experience).toFixed(2);
        stats.bwxp = player?.stats?.Bedwars?.Experience;
    }

    return stats;
};

// Helper functions
function getDuelsTitle(wins) {
    const titles = [
        { min: 56000, title: "Godlike X" },
        { min: 52000, title: "Godlike IX" },
        { min: 48000, title: "Godlike VIII" },
        { min: 44000, title: "Godlike VII" },
        { min: 40000, title: "Godlike VI" },
        { min: 36000, title: "Godlike V" },
        { min: 32000, title: "Godlike IV" },
        { min: 28000, title: "Godlike III" },
        { min: 24000, title: "Godlike II" },
        { min: 20000, title: "Godlike" },
        { min: 18000, title: "Grandmaster V" },
        { min: 16000, title: "Grandmaster IV" },
        { min: 14000, title: "Grandmaster III" },
        { min: 12000, title: "Grandmaster II" },
        { min: 10000, title: "Grandmaster" },
        { min: 8800, title: "Legend V" },
        { min: 7600, title: "Legend IV" },
        { min: 6400, title: "Legend III" },
        { min: 5200, title: "Legend II" },
        { min: 4000, title: "Legend" },
        { min: 3800, title: "Master V" },
        { min: 3200, title: "Master IV" },
        { min: 2800, title: "Master III" },
        { min: 2400, title: "Master II" },
        { min: 2000, title: "Master" },
        { min: 1800, title: "Diamond V" },
        { min: 1600, title: "Diamond IV" },
        { min: 1400, title: "Diamond III" },
        { min: 1200, title: "Diamond II" },
        { min: 1000, title: "Diamond" },
        { min: 900, title: "Gold V" },
        { min: 800, title: "Gold IV" },
        { min: 700, title: "Gold III" },
        { min: 600, title: "Gold II" },
        { min: 500, title: "Gold" },
        { min: 440, title: "Iron V" },
        { min: 380, title: "Iron IV" },
        { min: 320, title: "Iron III" },
        { min: 260, title: "Iron II" },
        { min: 200, title: "Iron" },
        { min: 180, title: "Rookie V" },
        { min: 160, title: "Rookie IV" },
        { min: 140, title: "Rookie III" },
        { min: 120, title: "Rookie II" },
        { min: 100, title: "Rookie" }
    ];

    for (const tier of titles) {
        if (wins >= tier.min) {
            return tier.title;
        }
    }
    return "No Rank";
}

function calculateRatio(wins, losses) {
    if (losses === 0) {
        return wins === 0 ? "N/A" : "Infinity";
    }
    return Math.round((wins / losses) * 100) / 100;
}

function getSWLevel(xp) {
    const totalXp = [20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000];
    let exactLevel = 0;

    if (xp >= 15000) {
        exactLevel = (xp - 15000) / 10000 + 12;
    } else {
        for (let i = 0; i < totalXp.length; i++) {
            if (xp < totalXp[i]) {
                exactLevel = i + 1 + (xp - (totalXp[i - 1] || 0)) / (totalXp[i] - (totalXp[i - 1] || 0));
                break;
            }
        }
    }
    return exactLevel.toFixed(2);
}

function cataXPCalculator(xp) {
    let level = 0;
    let xpNeeded = 0;
    
    // Find the highest level the player has reached
    for (let lvl = 1; lvl <= 50; lvl++) {
        xpNeeded = DUNGEONEERING_XP[lvl];
        if (xp >= xpNeeded) {
            level = lvl;
            xp -= xpNeeded;
        } else {
            break;
        }
    }
    
    // Calculate progress to next level if not max level
    if (level < 50) {
        const nextLevelXP = DUNGEONEERING_XP[level + 1];
        const progress = xp / nextLevelXP;
        return parseFloat((level + progress).toFixed(2));
    }
    
    return 50.00;
}

function skillLevelCalculator(xp, cap = 60) {
    if (!xp) return 0;
    
    const skillsXP = {
        50: 1,
        175: 2,
        375: 3,
        675: 4,
        1175: 5,
        1925: 6,
        2925: 7,
        4425: 8,
        6425: 9,
        9925: 10,
        14925: 11,
        22425: 12,
        32425: 13,
        47425: 14,
        67425: 15,
        97425: 16,
        147425: 17,
        222425: 18,
        322425: 19,
        522425: 20,
        822425: 21,
        1222425: 22,
        1722425: 23,
        2322425: 24,
        3022425: 25,
        3822425: 26,
        4722425: 27,
        5722425: 28,
        6822425: 29,
        8022425: 30,
        9322425: 31,
        10722425: 32,
        12222425: 33,
        13822425: 34,
        15522425: 35,
        17322425: 36,
        19222425: 37,
        21222425: 38,
        23322425: 39,
        25522425: 40,
        27822425: 41,
        30222425: 42,
        32722425: 43,
        35322425: 44,
        38072425: 45,
        40972425: 46,
        44072425: 47,
        47472425: 48,
        51172425: 49,
        55172425: 50,
        59472425: 51,
        64072425: 52,
        68972425: 53,
        74172425: 54,
        79672425: 55,
        85472425: 56,
        91572425: 57,
        97972425: 58,
        104672425: 59,
        111672425: 60
    };
    
    let level = 0;
    for (const [xpReq, lvl] of Object.entries(skillsXP)) {
        if (xp >= xpReq) {
            level = lvl;
        } else {
            break;
        }
    }
    
    return Math.min(level, cap);
}

function minionSlots(recipes) {
    const minionSlotRequirements = [
        { requiredCrafts: 0, bonusSlots: 0 },
        { requiredCrafts: 5, bonusSlots: 1 },
        { requiredCrafts: 15, bonusSlots: 2 },
        { requiredCrafts: 30, bonusSlots: 3 },
        { requiredCrafts: 50, bonusSlots: 4 },
        { requiredCrafts: 75, bonusSlots: 5 },
        { requiredCrafts: 100, bonusSlots: 6 },
        { requiredCrafts: 125, bonusSlots: 7 },
        { requiredCrafts: 150, bonusSlots: 8 },
        { requiredCrafts: 175, bonusSlots: 9 },
        { requiredCrafts: 200, bonusSlots: 10 },
        { requiredCrafts: 225, bonusSlots: 11 },
        { requiredCrafts: 250, bonusSlots: 12 },
        { requiredCrafts: 275, bonusSlots: 13 },
        { requiredCrafts: 300, bonusSlots: 14 },
        { requiredCrafts: 350, bonusSlots: 15 },
        { requiredCrafts: 400, bonusSlots: 16 },
        { requiredCrafts: 450, bonusSlots: 17 },
        { requiredCrafts: 500, bonusSlots: 18 },
        { requiredCrafts: 550, bonusSlots: 19 },
        { requiredCrafts: 600, bonusSlots: 20 },
        { requiredCrafts: 650, bonusSlots: 21 }
    ];
    
    let slots = 0;
    for (const requirement of minionSlotRequirements) {
        if (recipes >= requirement.requiredCrafts) {
            slots = requirement.bonusSlots;
        } else {
            break;
        }
    }
    return slots;
}

const EASY_LEVELS = 4;
const EASY_LEVELS_XP = [500, 1000, 2000, 3500];
const XP_PER_LEVEL = 5000;
const XP_PER_PRESTIGE = 96 * XP_PER_LEVEL + EASY_LEVELS_XP.reduce((a, b) => a + b, 0);
const LEVELS_PER_PRESTIGE = 100;

function getBedwarsLevel(exp) {
    const prestige = Math.floor(exp / XP_PER_PRESTIGE);
    let remainingXP = exp - prestige * XP_PER_PRESTIGE;
    let level = prestige * LEVELS_PER_PRESTIGE;
    
    for (let i = 0; i < EASY_LEVELS; i++) {
        if (remainingXP < EASY_LEVELS_XP[i]) {
            return level;
        }
        remainingXP -= EASY_LEVELS_XP[i];
        level++;
    }
    
    level += Math.floor(remainingXP / XP_PER_LEVEL);
    return level;
}