const { queryParams } = require("../../../../db/database")


module.exports = async function autonotifier(setting, notifyid, notifyemail) {
    if (!setting) return;
    if (notifyemail === null || notifyemail === undefined || notifyemail === '') return;
    if (notifyid === null || notifyid === undefined || notifyid === '') return;

    let isSubscribed = await queryParams(`SELECT * FROM email_notifier WHERE email=? AND user_id=?`, [notifyemail, notifyid]);
    if (isSubscribed.length === 0) {
       // console.log(`Added notifier for ${notifyemail}`);
        await queryParams(`INSERT INTO email_notifier(user_id, email) VALUES(?, ?)`, [notifyid, notifyemail]);
    }
    return;
}
