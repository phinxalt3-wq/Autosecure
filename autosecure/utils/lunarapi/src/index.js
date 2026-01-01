const { AssetServer } = require("./assetServer");
const { getLunarClientToken } = require("./auth");
const { UpdateCosmeticSettingsRequest } = require("./generated/protos/assets/cosmetics");
const fetch = require("node-fetch");
require('dotenv').config();

function formatUUIDWithDashes(rawUUID) {
    return rawUUID.replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        "$1-$2-$3-$4-$5"
    );
}

async function getMinecraftProfile(accessToken) {
    const response = await fetch("https://api.minecraftservices.com/minecraft/profile", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    if (!response.ok) return null;
    return await response.json();
}

async function getlunar(accessToken) {
    const profile = await getMinecraftProfile(accessToken);
    if (!profile) return null;

    const UUID = formatUUIDWithDashes(profile.id);
    const USERNAME = profile.name;

    const jwtToken = await getLunarClientToken(UUID, USERNAME, accessToken);
    if (!jwtToken) return null;

    console.log("Got lunar client auth token");

    const server = new AssetServer(accessToken, UUID, USERNAME, jwtToken);
    await server.ready;

    const cosmetics = server.getCosmeticManager().getCosmetics();
    const emotes = server.getEmotesManager().getEmotes();

    const result = JSON.stringify([cosmetics, emotes]);

    await server.disconnect();

    return result;
}

module.exports = { getlunar };



/// Just a test
async function main(){
    let accessToken = ""
    let result = await getlunar(accessToken)
    console.log(result)
}

// main()
