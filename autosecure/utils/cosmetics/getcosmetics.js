const { queryParams } = require("../../../db/database");
const { getcosmeticdata } = require("./getcosmeticdata");

// skidded from ward ty ;3

module.exports = async function getCosmetics(ign, refresh = false) {
    try {
        let query = await queryParams(`SELECT * FROM cosmetics WHERE name=?`, [ign], "all", "cache");

        if (refresh) {
            let d = await getcosmeticdata(ign);
            if (!d) return null;
            if (query.length == 0) {
                await queryParams(`INSERT INTO cosmetics(name,cosmetics,last_updated) VALUES(?,?,?)`, [ign, JSON.stringify(d), Date.now()], "all", "cache");
            } else {
                await queryParams(`UPDATE cosmetics SET cosmetics=?,last_updated=? WHERE name=?`, [JSON.stringify(d), Date.now(), ign], "all", "cache");
            }
            console.log(`cosmetic data: ${JSON.stringify(d)}`);
            return d;
        }

        if (query.length == 0) {
            let d = await getcosmeticdata(ign);
            if (!d) return null;
            await queryParams(`INSERT INTO cosmetics(name,cosmetics,last_updated) VALUES(?,?,?)`, [ign, JSON.stringify(d), Date.now()], "all", "cache");
            console.log(`cosmetic data: ${JSON.stringify(d)}`);
            return d;
        } else {
            if (Date.now() - 14400000 < query[0].last_updated) {
                return JSON.parse(query[0].cosmetics);
            } else {
                let d = await getcosmeticdata(ign);
                await queryParams(`UPDATE cosmetics SET cosmetics=?,last_updated=? WHERE name=?`, [JSON.stringify(d), Date.now(), ign], "all", "cache");
                console.log(`cosmetic data: ${JSON.stringify(d)}`);
                return d;
            }
        }
    } catch (e) {
        return null;
    }
}

