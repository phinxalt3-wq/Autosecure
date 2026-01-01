let autosecureMap = new Map();
let mainBotClient = null;

function setMainBotClient(client) {
    mainBotClient = client;
}

function getMainBotClient() {
    return mainBotClient;
}

module.exports = { autosecureMap, setMainBotClient, getMainBotClient };
