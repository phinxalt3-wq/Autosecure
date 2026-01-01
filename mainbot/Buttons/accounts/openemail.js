const emailMsg = require("../../utils/emails/emailMsg");

module.exports = {
    name: "email",
    mail: true,
    callback: async (client, interaction) => {
        try {

            await interaction.deferReply({ ephemeral: true });
            const [t, email] = interaction.customId.split("|");

            if (!email || email === "None" || email === "Invalid Login Cookie!") {

                return interaction.editReply({ content: "No email!", ephemeral: true });
            }

            const message = await emailMsg(email, interaction.user.id, 1);
            return interaction.editReply(message);
        } catch (error) {

            console.error(error);
 
            return interaction.reply({ content: "An error occurred while processing your request.", ephemeral: true });
        }
    }
};