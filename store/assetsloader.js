const cosmeticsdata = require("./cosmetics.json");
const emotesdata = require("./emotes.json");

const cosmeticsData = Array.isArray(cosmeticsdata)
    ? cosmeticsdata
    : Array.isArray(cosmeticsdata.cosmetics)
        ? cosmeticsdata.cosmetics
        : Array.isArray(cosmeticsdata.data)
            ? cosmeticsdata.data
            : [];

const emotesData = Array.isArray(emotesdata)
    ? emotesdata
    : Array.isArray(emotesdata.emotes)
        ? emotesdata.emotes
        : Array.isArray(emotesdata.data)
            ? emotesdata.data
            : [];

function getCosmeticNameById(id) {
    if (!id) return null;
    const cosmetic = cosmeticsData.find(c => c && parseInt(c.id) === parseInt(id));
    return cosmetic ? cosmetic.name : null;
}

function getEmoteNameById(id) {
    if (!id) return null;
    const emote = emotesData.find(e => e && parseInt(e.id) === parseInt(id));
    return emote ? emote.name : null;
}

module.exports = {
    getCosmeticNameById,
    getEmoteNameById
};
