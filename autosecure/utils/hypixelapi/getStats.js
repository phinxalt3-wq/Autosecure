const { queryParams } = require("../../../db/database")
const getData = require("./getData")
const refreshdelay = 43200000 /// 12h
module.exports = async (ign) => {
    try {
        // Check for existing stats
        let query = await queryParams(`SELECT * FROM stats WHERE name=?`, [ign], "all", "cache")
        if (query.length == 0) {
            // console.log(`Getting new stats data!`)
            // Get New Data (never been queried before)
            let d = await getData(ign)
            if (!d) return null
            // console.log(d)
            await queryParams(`INSERT INTO stats(name,stats,last_updated) VALUES(?,?,?)`, [ign, JSON.stringify(d), Date.now()], "all", "cache")
            return d
        } else {
            const cachedStats = JSON.parse(query[0].stats)
            // console.log(`Valid api key: ${cachedStats.hasapi}`)
            if (Date.now() - refreshdelay < query[0].last_updated && cachedStats.hasapi) {
                // console.log('already cached')
                return cachedStats
            } else {
                // Get New Data (expired or skips time if invalid API)
             //   // console.log(`Old data, refreshing!`)
                let d = await getData(ign)
                await queryParams(`UPDATE stats SET stats=?,last_updated=? WHERE name=?`, [JSON.stringify(d), Date.now(), ign], "all", "cache")
                return d
            }
        }
    } catch (e) {
        // console.log(`Catch in getStats`)
        // console.log(e)
        return null
    }
}