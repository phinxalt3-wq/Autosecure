const { tablesforuser, tablesfortransfer, tablestheycanhave } = require('../../../db/gettablesarray');
const { queryParams } = require("../../../db/database");

async function transferLicense(oldLicenseKey, userId, interactionUserId) {
    const generateRandomString = (length) => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    let newLicenseKey = oldLicenseKey.slice(0, -6) + generateRandomString(6);

    const tables = tablesforuser();
    const tablesrecover = tablesfortransfer();
    const specialTables = tablestheycanhave();

    try {
        for (const table of tables) {
            let column;
            if (table === "blacklisted" || table === "blacklistedemails") {
                column = "client_id";
            } else {
                column = "user_id";
            }
            await queryParams(`UPDATE ${table} SET ${column}=? WHERE ${column}=?`, [interactionUserId, userId]);
        }

        for (const table of tablesrecover) {
            if (specialTables.includes(table)) {
                await queryParams(`DELETE FROM ${table} WHERE user_id=?`, [interactionUserId]);

                const oldRecords = await queryParams(`SELECT * FROM ${table} WHERE user_id=?`, [userId]);

                for (const record of oldRecords) {
                    const columns = Object.keys(record);
                    const placeholders = columns.map(() => '?').join(',');
                    const values = columns.map(col => col === 'user_id' ? interactionUserId : record[col]);
                    await queryParams(
                        `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
                        values
                    );
                }

                await queryParams(`DELETE FROM ${table} WHERE user_id=?`, [userId]);
            } else {
                await queryParams(`UPDATE ${table} SET user_id=? WHERE user_id=?`, [interactionUserId, userId]);
            }
        }


        const checkLicense = await queryParams(`SELECT license FROM usedLicenses WHERE license=?`, [oldLicenseKey]);
if (!checkLicense.length) console.warn(`No license found with key: ${oldLicenseKey}`);

        await queryParams(
            `UPDATE usedLicenses SET license=? WHERE license=?`,
            [newLicenseKey, oldLicenseKey]
        );

        return newLicenseKey;
    } catch (error) {
        console.error('Error in transferLicense:', error);
        throw error;
    }
}

module.exports = {
    transferLicense
};
