module.exports = {
    name: "author",
    callback: (client, interaction) => {
        let author = interaction.components[0].components[0].value;
        let data = interaction.message.embeds[0].data
        if (data.author) {
            data.author.name = author
        } else {
            data.author = { name: author }
        }
        interaction.update({
            embeds: [interaction.message.embeds[0].data]
        })
    }
}