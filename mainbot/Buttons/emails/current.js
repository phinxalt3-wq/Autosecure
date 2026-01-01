const { ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const emailMsg = require("../../utils/emails/emailMsg");

module.exports = {
    name: "current",
    callback: async (client, interaction) => {
        const [t, email] = interaction.customId.split("|");

        // Create the modal to request page number input and show it
        const modal = new ModalBuilder()
            .setCustomId(`pageNumberModal|${email}`)
            .setTitle("Enter Page Number");

        // Add text input field for page number
        const textInput = new TextInputBuilder()
            .setCustomId("pageNumberInput")
            .setLabel("Page Number")
            .setStyle("1") // 'SHORT' is valid for single-line inputs
            .setPlaceholder("Enter a valid page number")
            .setRequired(true);
        
        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);

        // Show the modal to the user
        await interaction.showModal(modal);

        // Handle the modal submission immediately after the user enters the page number
        try {
            // Await for the modal submit interaction from the user
            const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 }); // 60 seconds timeout
            
            if (!modalInteraction) {
                return modalInteraction.reply({
                    content: 'You took too long to submit the page number.',
                    ephemeral: true,
                });
            }

            // Extract the page number from the modal input
            const pageInput = modalInteraction.fields.getTextInputValue("pageNumberInput");

            // Validate the page number input
            if (isNaN(pageInput) || parseInt(pageInput) < 1) {
                return modalInteraction.reply({
                    content: "Invalid page number! Please enter a valid number greater than 0.",
                    ephemeral: true,
                });
            }

            const page = parseInt(pageInput);

            // Directly call emailMsg, skipping the database check
            const message = await emailMsg(email, modalInteraction.user.id, page);
            await modalInteraction.reply(message);
        } catch (error) {
            console.error("Error handling modal submission:", error);
            await interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true,
            });
        }
    }
};
