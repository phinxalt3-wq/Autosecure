const { queryParams } = require("./db");
const { owners, novps } = require("../config.json");
const isOwner = require("./isOwner");

module.exports = async (userId, method = "2") => {
    let access = null;
    const currentEpoch = Math.floor(Date.now() / 1000);

    switch (method) {
        case "1":
            return await isOwner(userId);

        case "2":
            if (!(novps === true || novps === "true")) {
                if (owners.includes(userId)) return true;
            }

            access = await queryParams(
                `SELECT expiry FROM usedLicenses WHERE user_id = ?`,
                [userId]
            );

            if (access.length > 0) {
                const expiryEpoch = Math.floor(access[0].expiry / 1000);
                if (expiryEpoch > currentEpoch) return true;
            }
            break;

        default:
            break;
    }

    return false;
};
