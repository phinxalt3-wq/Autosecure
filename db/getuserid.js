module.exports = async function getuserid(interaction, client, spot, file) {
    let userid = null;

    if (interaction.customId && interaction.customId.split("|")[spot]) {
        console.log(`Already got userid from customid!`)
        userid = interaction.customId.split("|")[spot];
    }


    if (!userid && client.username) {
        userid = client.username
    }


    if (!userid) {
        console.log(`userid not defined in ${file}`);
        return null;
    }

    return userid;
};
