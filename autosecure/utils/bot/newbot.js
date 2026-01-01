const modalBuilder = require("../modalBuilder");
const { TextInputStyle } = require("discord.js");

module.exports = async function handlenewbot(interaction, userid, number) {
    interaction.showModal(modalBuilder(
        `handlenewbot|${userid}|${number}`,
        `Set Token`,
        [
            {
                setCustomId: 'token',
                setMaxLength: 256,
                setMinLength: 0,
                setRequired: true,
                setLabel: "New bot's token",
                setPlaceholder: "Enter token from Discord Developer Portal.",
                setStyle: TextInputStyle.Short
            }
        ]
    ));
};
