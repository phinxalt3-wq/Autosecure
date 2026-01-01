const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("@discordjs/builders");
const { queryParams } = require("../../../db/database");
const { ButtonStyle, EmbedBuilder } = require("discord.js");
const { footer } = require("../../../config.json");
const generate = require("../generate");
const short = require("short-number");

module.exports = async (id, current, uid = null) => {
    let embed = new EmbedBuilder()
        .setColor(0x808080);
    
    // Only set footer if text is not null/empty
    if (footer.text && footer.text.trim() !== '') {
        embed.setFooter({
            text: footer.text,
            iconURL: footer.icon_url
        });
    }
    // Note: Discord requires text property for footer, so we skip footer entirely if no text

    let buttons = [];
    let msg = {
        ephemeral: true
    };


    const userSettingsQuery = await queryParams(
        "SELECT sortingtype, hidenonmc FROM settings WHERE user_id=?", 
        [id]
    );
    const sortingType = userSettingsQuery[0]?.sortingtype || 'time_desc';
    const hideNonMC = userSettingsQuery[0]?.hidenonmc === 1;



 //   console.log(sortingType)

    let userUIDsQuery = "SELECT uid FROM accountsbyuser WHERE user_id=?";
    let userUIDs = await queryParams(userUIDsQuery, [id]);

    if (!userUIDs || userUIDs.length === 0) {
        msg.content = null;
        embed.setTitle("No Accounts");
        embed.setDescription("You don't have any accounts yet. Click the button below to add one.");

        let addAccountRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`addaccount|${id}`)
                .setLabel("Add Account")
                .setStyle(ButtonStyle.Success)
        );

        msg.embeds = [embed];
        msg.components = [addAccountRow];
        return msg;
    }

    // Fixed template literal syntax for the query
    let userAccountsQuery = `SELECT * FROM accounts WHERE uid IN (${userUIDs.map(u => `'${u.uid}'`).join(', ')})`;
    let userAccounts = await queryParams(userAccountsQuery);

    if (!userAccounts || userAccounts.length === 0) {
        msg.content = null;
        embed.setTitle("No Accounts");
        embed.setDescription("You don't have any accounts yet. Click the button below to add one.");

        let addAccountRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`addaccount|${id}`)
                .setLabel("Add Account")
                .setStyle(ButtonStyle.Success)
        );

        msg.embeds = [embed];
        msg.components = [addAccountRow];
        return msg;
    }

    if (hideNonMC) {
        userAccounts = userAccounts.filter(account => account.ownsmc === "Purchased" || account.ownsmc === "Gamepass" || account.ownsmc === "True (Source: N/A)");
    }



    if (userAccounts.length === 0) {
        msg.content = null;
        embed.setTitle("No Accounts to Display");
        embed.setDescription(hideNonMC ? 
            "You don't have any Minecraft accounts. Toggle 'Hiding Non-MC' to show all accounts or add a new one." : 
            "No accounts match your current filters.");

        let addAccountRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`addaccount|${id}`)
                .setEmoji({
                    name: '➕'
                })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`togglenonmc|${id}`)
                .setLabel(hideNonMC ? "Showing Non-MC" : "Hiding Non-MC")
                .setStyle(ButtonStyle.Primary)
        );

        msg.embeds = [embed];
        msg.components = [addAccountRow];
        return msg;
    }


    switch (sortingType) {
        case 'time_asc':
            userAccounts.sort((a, b) => {
                const aTime = parseInt(a.time) || 0;
                const bTime = parseInt(b.time) || 0;
                return aTime - bTime;
            });
            break;
            
        case 'time_desc':
            userAccounts.sort((a, b) => {
                const aTime = parseInt(a.time) || 0;
                const bTime = parseInt(b.time) || 0;
                return bTime - aTime;
            });
            break;
            
        case 'networth':
            const networthPromises = userAccounts.map(async (account) => {
                try {
                    const stats = account.stats_id ? JSON.parse(account.stats_id) : null;
                    const profile = stats?.skyblock?.find(prof => prof.current === true);
                    return {
                        ...account,
                        parsedStats: stats,
                        networth: profile?.networth || 0
                    };
                } catch (e) {
                    return { ...account, parsedStats: null, networth: 0 };
                }
            });
            
            userAccounts = await Promise.all(networthPromises);
            userAccounts.sort((a, b) => b.networth - a.networth);
            break;
            
        case 'skyblocklvl':
            const skyblockPromises = userAccounts.map(async (account) => {
                try {
                    const stats = account.stats_id ? JSON.parse(account.stats_id) : null;
                    const profile = stats?.skyblock?.find(prof => prof.current === true);
                    return {
                        ...account,
                        parsedStats: stats,
                        sblevel: profile?.levels || 9 
                    };
                } catch (e) {
                    return { ...account, parsedStats: null, sblevel: 0 };
                }
            });
            
            userAccounts = await Promise.all(skyblockPromises);
            userAccounts.sort((a, b) => b.sblevel - a.sblevel);
            break;
            
        case 'rank':
            const rankOrder = ['mvp++', 'mvp+', 'mvp', 'vip+', 'vip', 'none'];
            const rankPromises = userAccounts.map(async (account) => {
                try {
                    const stats = account.stats_id ? JSON.parse(account.stats_id) : null;
                    return {
                        ...account,
                        parsedStats: stats,
                        rank: stats?.rank?.toLowerCase() || 'none'
                    };
                } catch (e) {
                    return { ...account, parsedStats: null, rank: 'none' };
                }
            });
            
            userAccounts = await Promise.all(rankPromises);
            userAccounts.sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
            break;
            
        case 'network_level':
            const networkLevelPromises = userAccounts.map(async (account) => {
                try {
                    const stats = account.stats_id ? JSON.parse(account.stats_id) : null;
                    return {
                        ...account,
                        parsedStats: stats,
                        nwl: stats?.nwl || 0
                    };
                } catch (e) {
                    return { ...account, parsedStats: null, nwl: 0 };
                }
            });
            
            userAccounts = await Promise.all(networkLevelPromises);
            userAccounts.sort((a, b) => b.nwl - a.nwl);
            break;
            
        case 'bedwars_level':
            const bedwarsPromises = userAccounts.map(async (account) => {
                try {
                    const stats = account.stats_id ? JSON.parse(account.stats_id) : null;
                    return {
                        ...account,
                        parsedStats: stats,
                        bwlevel: stats?.bedwars?.level || 0
                    };
                } catch (e) {
                    return { ...account, parsedStats: null, bwlevel: 0 };
                }
            });
            
            userAccounts = await Promise.all(bedwarsPromises);
            userAccounts.sort((a, b) => b.bwlevel - a.bwlevel);
            break;
            
        default:
            userAccounts.sort((a, b) => {
                const aTime = parseInt(a.time) || 0;
                const bTime = parseInt(b.time) || 0;
                return bTime - aTime;
            });
            break;
    }

    if (uid) {
        const accountIndex = userAccounts.findIndex(account => account.uid === uid);
        if (accountIndex !== -1) {
            current = accountIndex + 1;
        }
    }

    current = parseInt(current) || 1;
    if (current > userAccounts.length) { current = userAccounts.length; }
    if (current < 1) { current = 1; }

    const currentAccount = userAccounts[current - 1];

    if (!currentAccount) {
        embed.setTitle("Account Not Found");
        embed.setDescription("The requested account could not be found.");

        let addAccountRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`addaccount|${id}`)
                .setLabel("Add Account")
                .setStyle(ButtonStyle.Success)
        );

        msg.embeds = [embed];
        msg.components = [addAccountRow];
        return msg;
    }

    let statInfo = "";
    if (currentAccount.username) {
        try {
            let stats = currentAccount.stats_id ? JSON.parse(currentAccount.stats_id) : null;
            const profile = stats?.skyblock?.find(prof => prof.current === true);

            if (stats) {
                const networth = profile?.networth || 0;
                const sbLevel = profile?.levels|| 0;
                const bwLevel = stats.bedwars?.level || 0;

                statInfo = `[${stats.rank || 'None'}] ${stats.name || currentAccount.username} (${!isNaN(stats.nwl) ? Math.round(stats.nwl) : 0}) | NW: ${short(networth)} SL: ${sbLevel} | BW: ${bwLevel}⭐`;
            } else {
                statInfo = `Account: ${currentAccount.username}`;
            }
        } catch (error) {
            statInfo = `Account: ${currentAccount.username}`;
        }
    } else {
        statInfo = "No Username";
    }

    msg.content = `UID: ${currentAccount.uid}`;
    embed.setTitle(statInfo);

    embed.setFields([
        { name: "Username", value: `\`\`\`${currentAccount.username || "Not set"}\`\`\``, inline: true },
        { name: "Owns Minecraft", value: `\`\`\`${currentAccount.ownsmc || "No"}\`\`\``, inline: true },
        { name: "Capes", value: "```" + (Array.isArray(currentAccount.capes) && currentAccount.capes.length > 0 ? currentAccount.capes.join(", ") : "None") + "```", inline: true },
        { name: "Recovery Code", value: `\`\`\`${currentAccount.recoverycode || "Not set"}\`\`\``, inline: false },
        { name: "Primary Email", value: `\`\`\`${currentAccount.email || "Not set"}\`\`\``, inline: true },
        { name: "Secondary Email", value: `\`\`\`${currentAccount.secemail || "Not set"}\`\`\``, inline: true },
        { name: "Secret Key", value: `\`\`\`${currentAccount.secretkey || "Not set"}\`\`\``, inline: true },
        { name: "Password", value: `\`\`\`${currentAccount.password || "Not set"}\`\`\``, inline: false },
    ]);


    if (currentAccount.time) {
        const timestamp = parseInt(currentAccount.time) * 1000;
        if (!isNaN(timestamp)) {
            const d = new Date(timestamp);
            embed.setTimestamp(d);
        }
    }

    let copyTextId = generate(32);
    await queryParams(
        "INSERT INTO actions(id, action) VALUES(?, ?)",
        [copyTextId, `copyText|${currentAccount.username}|${currentAccount.ownsmc}|${currentAccount.capes}|${currentAccount.recoverycode}|${currentAccount.email}|${currentAccount.secemail}|${currentAccount.secretkey}|${currentAccount.password}`]
    );

    const sortingLabels = {
        time_desc: "Time (new first)",
        networth: "Networth",
        skyblocklvl: "Skyblock Level",
        bedwars_level: "Bedwars Level",
        rank: "Rank",
        network_level: "Network Level",
        time_asc: "Time (oldest to newest)"
    };

    const sortSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`sort_accounts|${id}`)
        .setPlaceholder(`Currently filtering based on: ${sortingLabels[sortingType]}`)
        .addOptions([
            { label: 'Time (newest to oldest)', value: 'time_desc', description: 'Sort accounts by time (newest first)' },
            { label: 'Networth', value: 'networth', description: 'Sort accounts by networth' },
            { label: 'Skyblock Level', value: 'skyblocklvl', description: 'Sort accounts by Skyblock Level' },
            { label: 'Bedwars Level', value: 'bedwars_level', description: 'Sort accounts by Bedwars Level' },
            { label: 'Rank', value: 'rank', description: 'Sort accounts by Rank' },
            { label: 'Network Level', value: 'network_level', description: 'Sort accounts by network level' },
            { label: 'Time (oldest to newest)', value: 'time_asc', description: 'Sort accounts by time (oldest first)' }
        ]);

    const sortMenuRow = new ActionRowBuilder().addComponents(sortSelectMenu);

    let firstRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("copyText|" + copyTextId)
            .setLabel("Copy Info")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`email|${currentAccount.secemail}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ name: "📧" }),
        new ButtonBuilder()
            .setCustomId(`auth|${currentAccount.secretkey && currentAccount.secretkey.replace(/\s+/g, '').length > 4 ? currentAccount.secretkey.replace(/\s+/g, '') : '0'}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ name: "🔑" }),
        new ButtonBuilder()
            .setCustomId(`extrainformation|${currentAccount.uid}`)
            .setLabel("Extra Information")
            .setStyle(ButtonStyle.Success)
    );
    

    let next = (parseInt(current) + 1).toString();
    let back = (parseInt(current) - 1).toString();
    let fastforward = userAccounts.length;

    let secondRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`moveacc|${id}|1|fastbackward`).setEmoji({ name: "⏪" }).setStyle(ButtonStyle.Primary).setDisabled(Number(current) < 2), 
        new ButtonBuilder().setCustomId(`moveacc|${id}|${back}|backward`).setEmoji({ name: "◀️" }).setStyle(ButtonStyle.Primary).setDisabled(Number(current) < 2),
        new ButtonBuilder().setCustomId(`currentacc|${id}`).setLabel(`${current}/${userAccounts.length}`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`moveacc|${id}|${next}|forward`).setEmoji({ name: "➡️" }).setStyle(ButtonStyle.Primary).setDisabled(parseInt(current) >= userAccounts.length),
        new ButtonBuilder().setCustomId(`moveacc|${id}|${fastforward}|fastforward`).setEmoji({ name: "⏩" }).setStyle(ButtonStyle.Primary).setDisabled(parseInt(current) >= userAccounts.length)
    );

    let thirdRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`addaccount|${id}`)
            .setEmoji({
                name: '➕'
            })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`search|${id}|${currentAccount.uid}`)
            .setLabel("🔍")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`togglenonmc|${id}`)
            .setLabel(hideNonMC ? "Only MC" : "All")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`downloadaccounts|${id}`)
            .setEmoji({ name: '📥' })
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`deleteconfirm|${id}|${current}|${currentAccount.uid}`)
            .setEmoji({
                name: '➖'
            })
            .setStyle(ButtonStyle.Danger)
    );
    

    msg.embeds = [embed];
    msg.components = [sortMenuRow, firstRow, secondRow, thirdRow];
    return msg;
};