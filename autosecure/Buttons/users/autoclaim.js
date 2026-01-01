

module.exports = {
    name: "autoclaim",
    userOnly: true,
    callback: async (client, interaction) => {
        return interaction.reply({
            content: `Considering this option since it's easy to abuse, lmk`,
            ephemeral: true
        })
    }
}