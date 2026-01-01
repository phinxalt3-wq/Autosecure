const { queryParams } = require("../../../db/database")
const usersMsg = require("../../../autosecure/utils/embeds/usersMsg")
const { addnotification } = require("../../../mainbot/utils/usernotifications")

module.exports = {
    name: "claiming",
    editclaiming: true,
    callback: async (client, interaction) => {
        try {
            let [t, userId, current, rest, ownerid, botnumber] = interaction.customId.split("|");
            let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`, [ownerid, botnumber]);
            if (settings.length === 0) {
                return interaction.reply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Unexpected error occurred!`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                });
            }
            settings = settings[0];

            if (!settings.notification_channel || !settings.users_channel) {
                return interaction.reply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Please set a notification and users channel first using /set!`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                });
            }

            let user = await queryParams(`SELECT * FROM users WHERE user_id=? AND child=? AND botnumber=?`, [ownerid, userId, botnumber]);
            if (user.length === 0) {
                return interaction.update(await usersMsg(ownerid, current, interaction.user.id, botnumber));
            }
            user = user[0];

            let newClaimingStatus = user.claiming === 1 ? 0 : user.claiming === 0 ? -1 : 1;
            if (Number(rest) === -1 && newClaimingStatus === -1) {
                let msg = await usersMsg(ownerid, current, interaction.user.id, botnumber)
                msg.content = "You can't set both claiming modes to nothing!"
                return interaction.update(msg);
            }

            await queryParams(
                `UPDATE users SET claiming=? WHERE user_id=? AND child=? AND botnumber=?`,
                [newClaimingStatus, ownerid, userId, botnumber]
            );

            await addnotification(client, userId)

            return interaction.update(await usersMsg(ownerid, current, interaction.user.id, botnumber));
        } catch (error) {
            console.error(error);
            return interaction.reply({
                embeds: [{
                    title: `Error :x:`,
                    description: `An unexpected error occurred. Please try again later.`,
                    color: 0xff0000
                }],
                ephemeral: true
            });
        }
    }
};