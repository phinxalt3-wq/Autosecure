const { sendclaimownerembed } = require('../../../mainbot/utils/usernotifications')

module.exports = {
    name: "currentunclaimed",
    userOnly: true,
    callback: async (client, interaction) => {
        const pagenumber = interaction.fields.getTextInputValue('page');
        return interaction.update(await sendclaimownerembed(client, pagenumber));
    }
};
