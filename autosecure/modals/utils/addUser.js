const { queryParams } = require("../../../db/database");
const usersMsg = require("../../utils/embeds/usersMsg");
const validID = require('../../utils/utils/validID');

module.exports = {
    name: "adduser",
    editclaiming: true,
    callback: async (client, interaction) => {
        if (interaction.isModalSubmit() && interaction.customId.startsWith('adduser')) {
            const userId = interaction.fields.getTextInputValue('userid'); 
            const ownerid = interaction.customId.split("|")[2];
            const botnumber = interaction.customId.split("|")[3];

            const isValid = await validID(userId);
            if (!isValid) {
                return interaction.reply({
                    content: "Invalid User ID!",
                    ephemeral: true
                });
            }

            if (userId === ownerid) {
                return interaction.reply({
                    content: "This is the owner of the bot, no need to add it!",
                    ephemeral: true
                });
            }

            try {
                let isExist = await queryParams(
                    `SELECT * FROM users WHERE user_id=? AND child=? AND botnumber=?`, 
                    [ownerid, userId, botnumber]
                );
                
                if (isExist.length !== 0) {
                    return interaction.reply({
                        content: "This user has already been added.",
                        ephemeral: true
                    });
                }

                await queryParams(
                    `INSERT INTO users (user_id, child, addedby, botnumber, addedtime) VALUES (?, ?, ?, ?, ?)`, 
                    [ownerid, userId, interaction.user.id, botnumber, Date.now().toString()]
                );

                let users = await queryParams(
                    `SELECT * FROM users WHERE user_id=? AND botnumber=?`, 
                    [ownerid, botnumber]
                );
                
                const currentPage = users.length; 
                const msg = await usersMsg(ownerid, currentPage, interaction.user.id, botnumber);

                return interaction.update({ 
                    embeds: msg.embeds, 
                    components: msg.components, 
                    ephemeral: true 
                });
            } catch (error) {
                console.error("Error adding user:", error);
                return interaction.reply({
                    content: "An error occurred while adding the user. Please try again.",
                    ephemeral: true
                });
            }
        }
    }
};