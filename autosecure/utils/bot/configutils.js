const { tablesforuser, tablesbotnumber, tablesclientid } = require('../../../db/gettablesarray');
const { queryParams } = require('../../../db/database');
const autosecure = require('../../autosecure');
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');


async function getTableColumns(tableName) {
    const rows = await queryParams(
        `PRAGMA table_info(${tableName})`,
        [],
        "all"
    );
    return rows.map(row => row.name);
}

async function importConfig(config, user_id, botnumber = null) {
    const clientIdTables = tablesclientid();
    const allowedTables = tablesforuser();
    const botTables = tablesbotnumber();
    let result = {};

    const userBotNumbers = await getUserBotNumbers(user_id);
    const userHasBotNumber = (num) => userBotNumbers.includes(num);

    for (const [tableName, tableData] of Object.entries(config)) {
        if (!allowedTables.includes(tableName)) continue;
        if (!Array.isArray(tableData)) continue;

        const isBotTable = botTables.includes(tableName);

        if (botnumber !== null && !isBotTable) continue;

        // Get actual columns from the DB for this table
        let validColumns;
        try {
            validColumns = await getTableColumns(tableName);
        } catch {
            // If error getting columns, skip this table entirely
            continue;
        }

        if (tableName === 'autosecure' && tableData[0]?.token && typeof tableData[0].botnumber !== 'undefined') {
            if (!userHasBotNumber(tableData[0].botnumber)) {
                continue;
            }

            result = {
                token: tableData[0].token,
                botnumber: tableData[0].botnumber,
                user_id: tableData[0].user_id || user_id
            };
        }

        for (const entry of tableData) {
            if (!entry || typeof entry !== 'object') continue;

            const dbEntry = {};
            for (const [key, value] of Object.entries(entry)) {
                if (
                    value !== undefined &&
                    value !== null &&
                    key !== 'id' &&
                    validColumns.includes(key)
                ) {
                    dbEntry[key] = value;
                }
            }

            if (clientIdTables.includes(tableName) && validColumns.includes('client_id')) {
                dbEntry.client_id = user_id;
            } else if (validColumns.includes('user_id')) {
                dbEntry.user_id = user_id;
            }

            if (isBotTable && validColumns.includes('botnumber')) {
                if (botnumber !== null) {
                    dbEntry.botnumber = botnumber;
                } else if (dbEntry.botnumber !== undefined) {
                    if (!userHasBotNumber(dbEntry.botnumber)) {
                        continue;
                    }
                }
            }

            if (Object.keys(dbEntry).length === 0) continue;

            try {
                const columns = Object.keys(dbEntry).join(', ');
                const values = Object.values(dbEntry);
                const placeholders = values.map(() => '?').join(', ');
                await queryParams(
                    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
                    values
                );
            } catch {
                // Silently ignore insert errors (e.g. constraints, duplicates, etc.)
                continue;
            }
        }
    }

    return result;
}


















async function getUserBotNumbers(user_id) {
    try {
        const [slots] = await queryParams(
            'SELECT slots FROM slots WHERE user_id = ?',
            [user_id]
        );
        return Array.from({length: slots?.slots || 1}, (_, i) => i + 1);
    } catch (error) {
        console.error('Error getting bot numbers:', error);
        return [1];
    }
}

async function saveBotConfig(user_id, botnumber) {
    const config = {};
    const botTables = tablesbotnumber();
    const clientIdTables = tablesclientid()

    for (const table of botTables) {
        try {
            const useClientId = clientIdTables.includes(table);
            const query = useClientId
                ? `SELECT * FROM ${table} WHERE client_id = ? AND botnumber = ?`
                : `SELECT * FROM ${table} WHERE user_id = ? AND botnumber = ?`;
            
            const data = await queryParams(query, [user_id, botnumber]);
            if (data.length > 0) {
                config[table] = data.map(cleanEntry);
            }
        } catch (error) {
            console.error(`Error exporting ${table}:`, error);
        }
    }

    return config;
}


async function saveFullConfig(user_id) {
    const config = {};
    const botNumbers = await getUserBotNumbers(user_id);
    const botTables = tablesbotnumber();
    const userTables = tablesforuser().filter(t => !botTables.includes(t));
    const clientIdTables = tablesclientid();

    // Save bot-specific configs
    for (const table of botTables) {
        try {
            const query = clientIdTables.includes(table)
                ? `SELECT * FROM ${table} WHERE client_id = ?`
                : `SELECT * FROM ${table} WHERE user_id = ?`;
            
            const allData = await queryParams(query, [user_id]);
            if (allData.length > 0) {
                config[table] = allData.map(cleanEntry);
            }
        } catch (error) {
            console.error(`Error exporting ${table}:`, error);
        }
    }

    // Save non-bot-specific configs
    for (const table of userTables) {
        try {
            const query = clientIdTables.includes(table)
                ? `SELECT * FROM ${table} WHERE client_id = ?`
                : `SELECT * FROM ${table} WHERE user_id = ?`;
            
            const data = await queryParams(query, [user_id]);
            if (data.length > 0) {
                config[table] = data.map(cleanEntry);
            }
        } catch (error) {
            console.error(`Error exporting ${table}:`, error);
        }
    }

    return config;
}

function cleanEntry(entry) {
    const cleaned = {};
    for (const [key, value] of Object.entries(entry)) {
        if (key !== 'id' && value !== undefined && value !== null) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

async function importBotConfig(config, user_id, botnumber) {
    // First verify the user has this bot number
    const userBotNumbers = await getUserBotNumbers(user_id);
    if (!userBotNumbers.includes(botnumber)) {
        throw new Error(`You don't have access to bot number ${botnumber}`);
    }

    await clearBotConfig(user_id, botnumber);
    const configinfo = await importConfig(config, user_id, botnumber);
    
    if (!configinfo.botnumber || !configinfo.token) {
        console.log(`No autosecure token found for bot ${botnumber}`);
        return false;
    }
    
    console.log(`Starting bot number ${configinfo.botnumber}`);
    const bot = await autosecure(configinfo.token, configinfo.user_id, configinfo.botnumber);
    if (bot) {
        const key = `${configinfo.user_id}|${configinfo.botnumber}`;
        console.log(`Added bot to autosecureMap with key: ${key}`);
        autosecureMap.set(key, bot);
        return true;
    }
    return false;
}

async function clearBotConfig(user_id, botnumber) {
    const botTables = tablesbotnumber();
    const clientIdTables = tablesclientid();
    
    for (const table of botTables) {
        try {
            const query = clientIdTables.includes(table)
                ? `DELETE FROM ${table} WHERE client_id = ? AND botnumber = ?`
                : `DELETE FROM ${table} WHERE user_id = ? AND botnumber = ?`;
            
            await queryParams(query, [user_id, botnumber]);
        } catch (error) {
            console.error(`Error clearing ${table}:`, error);
        }
    }
}

async function clearFullConfig(user_id) {
    const allowedTables = tablesforuser();
    const clientIdTables = tablesclientid();
    
    for (const table of allowedTables) {
        try {
            const query = clientIdTables.includes(table)
                ? `DELETE FROM ${table} WHERE client_id = ?`
                : `DELETE FROM ${table} WHERE user_id = ?`;
            
            await queryParams(query, [user_id]);
        } catch (error) {
            console.error(`Error clearing ${table}:`, error);
        }
    }
}

async function sendFullConfigToUser(user_id, client, istrial = false) {
    let user;
    try {
        user = await client.users.fetch(user_id);
        if (!user) {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(`Failed to fetch user ${user_id}:`, error);
        return; 
    }

    let config;
    try {
        config = await saveFullConfig(user_id);
    } catch (error) {
        console.error(`Failed to save full config for user ${user_id}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle('Failed to generate a backup of your full config. Please report this issue.')
                .setColor('#5f9ea0');
            await user.send({ embeds: [failedEmbed] });
        } catch (dmError) {
            console.error(`Failed to send failure DM to user ${user_id}:`, dmError);
        }
        return;
    }

    try {
        const buffer = Buffer.from(JSON.stringify(config, null, 2));
        const attachment = new AttachmentBuilder(buffer, { name: `full_config_${user_id}.json` });

        const title = istrial
            ? `Your full config download is above. Once you purchase a license, you'll be able to use this config from your trial again right away.`
            : `Your full config download is above.`;

        const configEmbed = new EmbedBuilder()
            .setTitle(title)
            .setColor('#5f9ea0');

        await user.send({
            embeds: [configEmbed],
            files: [attachment]
        });
    } catch (error) {
        console.error(`Failed to send config to user ${user_id}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle('Failed to send your config file. Please check your DM settings.')
                .setColor('#5f9ea0');
            await user.send({ embeds: [failedEmbed] });
        } catch (dmError) {
            console.error(`Failed to send failure DM to user ${user_id}:`, dmError);
        }
    }
}


async function sendBotConfigToUser(user_id, botnumber, client) {
    let user;
    try {
        user = await client.users.fetch(user_id);
        if (!user) {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(`Failed to fetch user ${user_id}:`, error);
        return; 
    }

    let config;
    try {
        config = await saveBotConfig(user_id, botnumber);
        if (!config || Object.keys(config).length === 0) {
            throw new Error('No configuration data found for this bot');
        }
    } catch (error) {
        console.error(`Failed to save bot config for user ${user_id}, bot ${botnumber}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle(`Failed to generate a backup of your config for bot ${botnumber}, please report this.`)
                .setColor('#5f9ea0');
            await user.send({ embeds: [failedEmbed] });
        } catch (dmError) {
            console.error(`Failed to send failure DM to user ${user_id}:`, dmError);
        }
        return;
    }

    try {
        const buffer = Buffer.from(JSON.stringify(config, null, 2));
        const attachment = new AttachmentBuilder(buffer, { name: `bot${botnumber}_config_${user_id}.json` });
const configEmbed = new EmbedBuilder()
    .setTitle(`You've recently deleted bot ${botnumber}. Use \`/config load mode: bot\` to restore it, if needed!`)
    .setColor('#5f9ea0')
    .setTimestamp()


        await user.send({
            embeds: [configEmbed],
            files: [attachment]
        });
    } catch (error) {
        console.error(`Failed to send config to user ${user_id}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle(`Failed to send your bot ${botnumber} config file, please check your DM settings.`)
                .setColor('#5f9ea0');
            await user.send({ embeds: [failedEmbed] });
        } catch (dmError) {
            console.error(`Failed to send failure DM to user ${user_id}:`, dmError);
        }
    }
}


module.exports = {
    importConfig,
    getUserBotNumbers,
    saveBotConfig,
    saveFullConfig,
    importBotConfig,
    clearBotConfig,
    clearFullConfig,
    sendFullConfigToUser,
    sendBotConfigToUser
};