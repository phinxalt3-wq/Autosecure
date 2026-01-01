const isUrl = require("../../../autosecure/utils/utils/isUrl");


/*
Fixed authorurl url -> icon_url
*/

module.exports = {
    name: "authorurl",
    callback: (client, interaction) => {
        let authorUrl = interaction.components[0].components[0].value;
        let data = interaction.message.embeds[0].data;

        console.log(`Author URL: ${authorUrl}`);

        if (authorUrl.length === 0) {
            if (data.author) {
                delete data.author.icon_url;
            }
            return interaction.update({
                embeds: [data]
            });
        }

        if (!isUrl(authorUrl)) {
            return interaction.update({ content: "Invalid URL", ephemeral: true });
        }

        if (data.author) {
            data.author.icon_url = authorUrl;
        } else {
            data.author = { icon_url: authorUrl };
        }

        interaction.update({
            embeds: [data]
        });
    }
};


