const { ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const emailMsg = require("../../utils/emails/emailMsg");

module.exports = {
    name: "current",
    callback: async (client, interaction) => {
        const [t, email] = interaction.customId.split("|");


        const modal = new ModalBuilder()
            .setCustomId(`pageNumberModal|${email}`)
            .setTitle("Enter Page Number");


        const textInput = new TextInputBuilder()
            .setCustomId("pageNumberInput")
            .setLabel("Page Number")
            .setStyle("1") // 'SHORT' is valid for single-line inputs
            .setPlaceholder("Enter a valid page number")
            .setRequired(true);
        
        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);


        await interaction.showModal(modal);


        try {

            const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 }); // 60 seconds timeout
            
            if (!modalInteraction) {
                return modalInteraction.reply({
                    content: 'You took too long to submit the page number.',
                    ephemeral: true,
                });
            }


            const pageInput = modalInteraction.fields.getTextInputValue("pageNumberInput");


            if (isNaN(pageInput) || parseInt(pageInput) < 1) {
                return modalInteraction.reply({
                    content: "Invalid page number! Please enter a valid number greater than 0.",
                    ephemeral: true,
                });
            }

            const page = parseInt(pageInput);


            const message = await emailMsg(email, modalInteraction.user.id, page);
            await modalInteraction.update(message);
        } catch (error) {
            console.error("Error handling modal submission:", error);
            await interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true,
            });
        }
    }
};
