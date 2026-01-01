const HttpClient = require('../process/HttpClient');

module.exports = async (ssid) => {
  let mc = { source: null };
  let axios = new HttpClient();

  try {
    // Fetch licenses (critical - checks if account owns Minecraft)
    let licenses;
    try {
      licenses = await axios.get(
        `https://api.minecraftservices.com/entitlements/license?requestId=c24114ab-1814-4d5c-9b1f-e8825edaec1f`,
        {
          headers: {
            Authorization: `Bearer ${ssid}`,
          },
        },
        3 // 3 retries for critical ownership check
      );
    } catch (err) {
      console.error(`[profile.js] Failed to fetch licenses after retries:`, err.message);
      return mc; // Return without ownership data
    }

    if (!licenses?.data) {
      console.error(`[profile.js] Licenses API returned no data`);
      return mc;
    }

    if (licenses?.status >= 400) {
      console.error(`[profile.js] Licenses API returned status ${licenses.status}:`, licenses.data);
      return mc;
    }

    let rawItems = [];
    if (licenses?.data?.items) {
      rawItems = licenses.data.items;
    }

    // Check for Minecraft ownership
    if (licenses?.data?.items) {
      for (let item of licenses.data.items) {
        if (item.name == "product_minecraft" || item.name == "game_minecraft") {
          if (item.source == "GAMEPASS") {
            mc.source = "Gamepass";
          } else if (item.source == "PURCHASE" || item.source == "MC_PURCHASE") {
            mc.source = "Purchased";
          } else {
            console.log(`[profile.js] Unexpected item source:`, item);
          }
        }
      }
    }

    // Process items
    const seen = new Map();
    for (const item of rawItems) {
      let baseName = item.name.replace(/^product_/, '').replace(/^game_/, '');
      let prettyName;

      if (baseName === 'minecraft') {
        prettyName = 'Minecraft Java';
      } else if (baseName === 'minecraft_bedrock') {
        prettyName = 'Minecraft Bedrock';
      } else {
        prettyName = baseName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }

      if (seen.has(prettyName)) {
        const existing = seen.get(prettyName);
        if (existing.source === 'PURCHASE' && item.source === 'MC_PURCHASE') {
          seen.set(prettyName, { name: prettyName, source: item.source });
        }
      } else {
        seen.set(prettyName, { name: prettyName, source: item.source });
      }
    }

    const finalItems = Array.from(seen.values());
    mc.items = finalItems;

    // Fetch profile (non-critical, but helpful for data)
    let profile;
    try {
      profile = await axios.get(
        `https://api.minecraftservices.com/minecraft/profile`,
        {
          headers: {
            Authorization: `Bearer ${ssid}`,
          },
        },
        2 // 2 retries for profile data
      );
    } catch (err) {
      console.warn(`[profile.js] Failed to fetch profile data:`, err.message);
      // Continue with what we have (ownership was already determined)
      return mc;
    }

    if (!profile?.data) {
      console.warn(`[profile.js] Profile API returned no data`);
      return mc;
    }

    if (profile?.status >= 400) {
      console.warn(`[profile.js] Profile API returned status ${profile.status}`);
      return mc;
    }

    const data = profile.data;
    let capes = [];

    if (data && Array.isArray(data.capes)) {
      capes = data.capes.filter(cape => cape.alias).map(cape => cape.alias);
    }

    mc.name = data?.name || null;
    mc.uuid = data?.id || null;
    mc.capes = capes || null;
    mc.skins = data?.skins || null;
    mc.ssid = ssid;

    return mc;

  } catch (err) {
    console.error(`[profile.js] Unexpected error in profile fetch:`, err);
    return mc; // Return partial data - at minimum the ownership flag if set
  }
};
