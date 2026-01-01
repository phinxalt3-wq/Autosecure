const { queryParams } = require("../../../db/database");
const { addnotification } = require("../../../mainbot/utils/usernotifications");
const usersMsg = require("../../utils/embeds/usersMsg");

module.exports = {
    name: "splitrest",
    editclaiming: true,
    callback: async (client, interaction) => {
        try {
            let [t, current, child, rest, claiming, split, ownerid, botnumber] = interaction.customId.split("|");

            let newsplit = Number(split) - 1;
            if (newsplit > 0.1) {
                let newrest;
                const currentRest = Number(rest);

                if (currentRest === -1) {
                    newrest = 0; // Switch from Nothing to SSID
                } else if (currentRest === 0) {
                    newrest = 1;  // Switch from SSID to Full
                } else {
                    newrest = -1; // Switch from Full to Nothing
                }

                // Prevent both claiming and rest being set to nothing
                if (newrest === -1 && Number(claiming) === -1) {
                    let msg = await usersMsg(ownerid, parseInt(current), interaction.user.id, botnumber);
                    msg.content = "You can't set both claiming and rest modes to nothing!";
                    return interaction.update(msg);
                }

                await queryParams(
                    `UPDATE users SET rest=? WHERE user_id=? AND child=? AND botnumber=?`,
                    [newrest, ownerid, child, botnumber]
                );
            }

            // Add notification for the user
            await addnotification(client, child);

            // Return updated users message with all parameters
            return interaction.update(
                await usersMsg(ownerid, parseInt(current), interaction.user.id, botnumber)
            );
        } catch (error) {
            console.error("Error in splitrest command:", error);
            return interaction.reply({ 
                content: "An error occurred while updating split rest mode.", 
                ephemeral: true 
            });
        }
    },
};