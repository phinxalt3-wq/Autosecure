const { getUserBotNumbers } = require("../autosecure/utils/bot/configutils");
const { queryParams } = require("./database");
const { tablesforuser, tablesbotnumber, tablesclientid, tablesfortransfer } = require("./gettablesarray");
const { getUser } = require("./usersCache");

async function getuserdata(license) {
    try {
        const usedLicense = await queryParams(`SELECT * FROM usedLicenses WHERE license = ?`, [license]);
        if (usedLicense.length === 0) return null;

        const licenseData = usedLicense[0];
        const ownerid = licenseData.user_id;

        if (new Date(licenseData.expiry) < new Date()) return null;

        const tables = [...new Set([...tablesforuser(), ...tablesfortransfer()])];
        const botTables = tablesbotnumber();
        const clientTables = tablesclientid();
        const botnumbers = await getUserBotNumbers(ownerid);

        let resUser = await getUser(ownerid)

        const settings = {};

        // Validate table names to prevent SQL injection
        const validateTableName = (name) => /^[a-zA-Z0-9_]+$/.test(name);

        for (const table of tables) {
            if (!validateTableName(table)) {
                console.error(`Invalid table name: ${table}`);
                continue;
            }
            let rows = [];

            if (clientTables.includes(table)) {
                rows = await queryParams(`SELECT * FROM ${table} WHERE client_id = ?`, [ownerid]);
            } else if (botTables.includes(table)) {
                for (const botnumber of botnumbers) {
                    const botRows = await queryParams(
                        `SELECT * FROM ${table} WHERE user_id = ? AND botnumber = ?`,
                        [ownerid, botnumber]
                    );
                    rows.push(...botRows);
                }
            } else {
                rows = await queryParams(`SELECT * FROM ${table} WHERE user_id = ?`, [ownerid]);
            }

            settings[table] = rows;
        }

        return {
            license: license,
            username: resUser.username,
            avatar: resUser.avatar,
            userid: ownerid,
            expiry: licenseData.expiry,
            istrial: licenseData.istrial,
            settings: settings
        };
    } catch (error) {
        console.error("Error getting user from license:", error);
        return null;
    }
}

module.exports = {
    getuserdata
}