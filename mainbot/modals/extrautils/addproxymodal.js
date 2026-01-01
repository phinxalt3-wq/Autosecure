const { queryParams } = require("../../../db/database");
const showproxiespanel = require("../../../autosecure/utils/utils/showproxiespanel");
const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

async function insertProxies(userId, proxies) {
    for (const proxy of proxies) {
        const command = `INSERT INTO proxies (user_id, proxy) VALUES (?, ?)`;
        const params = [userId, proxy];
        await queryParams(command, params);
    }
}

function splitProxies(rawInput) {
    const proxies = [];
    let buffer = '';
    let colonCount = 0;

    for (let i = 0; i < rawInput.length; i++) {
        const char = rawInput[i];
        buffer += char;

        if (char === ':') {
            colonCount++;
        }

        if (colonCount === 3) {
            let j = i + 1;
            while (j < rawInput.length) {
                const nextChar = rawInput[j];

                if (nextChar === '\n' || nextChar === '\r' || nextChar === ' ') {
                    proxies.push(buffer.trim());
                    buffer = '';
                    colonCount = 0;
                    break;
                }

                buffer += nextChar;
                j++;
            }
            i = j - 1;
        }
    }

    if (buffer.trim() !== '') {
        proxies.push(buffer.trim());
    }

    return proxies;
}

module.exports = {
    name: "addproxymodal",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferUpdate();

            const checkingMsg = await showproxiespanel(client, interaction.user.id);
            checkingMsg.content = "Processing proxies... Please wait.";
            await interaction.editReply(checkingMsg);

            const proxyInput = interaction.fields.getTextInputValue("proxyfield").trim();
            const proxiesRaw = splitProxies(proxyInput);

            if (proxiesRaw.length === 0) {
                const msg = await showproxiespanel(client, interaction.user.id);
                msg.content = `No valid proxies found.`;
                await interaction.editReply(msg);
                return;
            }

            const uniqueProxies = [...new Set(proxiesRaw)];
            const removedDuplicates = proxiesRaw.length - uniqueProxies.length;

            await insertProxies(interaction.user.id, uniqueProxies);

            if (uniqueProxies.length === 1) {
                const proxy = uniqueProxies[0];
                const [host, port, username, password] = proxy.split(':');
                const proxyUrl = `socks5://${username}:${password}@${host}:${port}`;
                const agent = new SocksProxyAgent(proxyUrl);

                const start = Date.now();
                try {
                    const response = await axios.get('https://httpbin.org/ip', {
                        httpAgent: agent,
                        httpsAgent: agent,
                        proxy: false,
                        timeout: 5000
                    });
                    const latency = Date.now() - start;
                    const ip = response.data.origin;

                    const updatedMsg = await showproxiespanel(client, interaction.user.id);
                    updatedMsg.content = `Added 1 proxy.\nIP: ${ip}\nLatency: ${latency}ms.`;
                    await interaction.editReply(updatedMsg);
                } catch (err) {
                    const updatedMsg = await showproxiespanel(client, interaction.user.id);
                    updatedMsg.content = `Added 1 proxy but couldn't verify it (might be dead or invalid).`;
                    await interaction.editReply(updatedMsg);
                }
            } else {
                const updatedMsg = await showproxiespanel(client, interaction.user.id);
                updatedMsg.content = `Added ${uniqueProxies.length} proxies.\nNote: Lists of proxies can't be checked, make sure they're correct.`;
                await interaction.editReply(updatedMsg);
            }
        } catch (error) {
            const msg = await showproxiespanel(client, interaction.user.id);
            msg.content = `An error occurred: ${error.message}`;
            await interaction.editReply(msg);
        }
    }
};
