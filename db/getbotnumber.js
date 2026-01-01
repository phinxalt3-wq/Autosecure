// Works for botnumbers 1-99


module.exports = async function getbotnumber(interaction, client, spot, file) {
    let botnumber = null;

    if (interaction.customId && interaction.customId.split("|")[spot]) {
        const val = interaction.customId.split("|")[spot];
        if (/^\d{1,2}$/.test(val)) {
           // console.log(`Already got botnumber from customid!`);
            botnumber = val;
        }
    }

    if (!botnumber && client.botnumber && /^\d{1,2}$/.test(client.botnumber.toString())) {
        botnumber = client.botnumber.toString();
    }

    if (!botnumber) {
        console.log(`Botnumber not defined in ${file}`);
        return null;
    }

    return botnumber;
};
