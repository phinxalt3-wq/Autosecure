const axios = require('axios');
const config = require('../../../config.json');


const BOT_TOKEN = config.tokens[0];

async function validID(userId) {
    const url = `https://discord.com/api/v10/users/${userId}`;
    const headers = {
        Authorization: `Bot ${BOT_TOKEN}`,
    };

    try {
        const response = await axios.get(url, { headers });


        return response.status === 200;
    } catch (error) {
        console.log(`Invalid irl!`)
        if (error.response && error.response.status === 404) {

            return false;
        }

        return false;
    }
}

module.exports = validID;
