const { AssetServer } = require("./assetServer");
const { getLunarClientToken } = require("./auth");
const { UpdateCosmeticSettingsRequest } = require("./generated/protos/assets/cosmetics");
require('dotenv').config();

async function main() {
    const jwtToken = await getLunarClientToken(process.env.UUID, process.env.MINECRAFT_USERNAME, process.env.ACCESS_TOKEN);
    console.log("Got lunar client auth token");

    const server = new AssetServer(process.env.ACCESS_TOKEN, process.env.UUID, process.env.MINECRAFT_USERNAME, jwtToken);
    await server.ready;

    console.dir(JSON.stringify(server.getCosmeticManager().getCosmetics()));
    console.dir(JSON.stringify(server.getEmotesManager().getEmotes()));
}

module.exports = { main };
main()