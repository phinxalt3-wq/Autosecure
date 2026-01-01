
const listProfile = require("../../../autosecure/utils/hypixelapi/listProfile");
const getUUID = require("../../../autosecure/utils/hypixelapi/getUUID")

module.exports = {
    name: "stats",
    description: `Stats of a user!`,
    options: [{
        name: "username",
        description: `Username of the user!`,
        type: 3,
        required: true
    }],
    userOnly: true,
    callback: async (client, interaction) => {
        let username = interaction.options.getString("username");
        await interaction.deferReply({ ephemeral: true });

        let uuid = getUUID(username)

        if(!uuid){
            return interaction.editReply({
                content: 'Invalid username!',
                ephemeral: true
            })  
        }


            return interaction.editReply(await listProfile(username, { sensored: false, list: "skyblock", ping: "" }));

    }
};
