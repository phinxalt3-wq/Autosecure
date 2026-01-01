const defaultEmbeds = require("./defaultEmbeds")

module.exports = async function getembedphisher(client, type, data) {
    let id = client.username;
    let e = await client.queryParams(`SELECT * FROM embeds WHERE user_id=? AND type=?`, [id, type]);
    let msg = null;

    if (e.length === 0) {
        msg = defaultEmbeds(type);
    } else {
        msg = JSON.parse(e[0].embed);
    }

    const replacements = {
        "%USERNAME%": data.username || ""
    };

    const replacePlaceholders = (text) => {
        if (!text || typeof text !== "string") return text || "";

        let result = text;
        Object.entries(replacements).forEach(([placeholder, value]) => {
            result = result.replaceAll(placeholder, value);
        });

        return result;
    };

    const processObject = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(processObject);

        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === "string") {
                result[k] = replacePlaceholders(v);
            } else if (typeof v === "object" && v !== null) {
                result[k] = processObject(v);
            } else {
                result[k] = v;
            }
        }
        return result;
    };

    try {
        msg = processObject(msg);
    } catch (error) {
        console.error(`Error processing embed placeholders in getembedphisher: ${error.message}`, error);
    }

    return msg;
};
