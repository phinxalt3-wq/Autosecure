const axios = require("axios");
const getUUID = require("../hypixelapi/getUUID");

async function getcosmeticdata(ign) {
    const uuid = await getUUID(ign);
    const hyphenatedUUID = insertHyphens(uuid);

    let labydataRes;
    try {
        labydataRes = await axios.get(`https://dl.labymod.net/userdata/${hyphenatedUUID}.json`);
    } catch {
        return {
            amount: 0,
            data: null
        };
    }

    if (labydataRes.status > 400) {
        return {
            amount: 0,
            data: null
        };
    }

    const infoRes = await axios.get('https://dl.labymod.net/cosmetics/index.json');
    const cdata = labydataRes.data.c;
    const cosmeticData = infoRes.data.cosmetics;

    const numbers = [];
    for (const cos of cdata) {
        numbers.push(cos.i);
    }

    const names = numbers.map(id => {
        const idStr = id.toString();
        return cosmeticData[idStr] ? cosmeticData[idStr].name : `Unknown (${idStr})`;
    });

    return {
        amount: numbers.length,
        data: names ? JSON.stringify(names) : null
    };
}

module.exports = {
    getcosmeticdata,
};

function insertHyphens(uuid) {
    return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
