require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { setupMemberHandler } = require('./handlers/welcomeHandler');
const { TOKEN } = process.env;

if (!TOKEN) {
  console.error('Missing TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildInvites],
  partials: [Partials.GuildMember]
});

const { setupInteractionHandler } = require('./handlers/interactionHandler');

setupMemberHandler(client);
setupInteractionHandler(client);

client.once('ready', async () => {
  console.log(`Welcome-bot ready as ${client.user.tag}`);

  // Register commands for either configured guild or globally
  const commands = [];
  for (const cmd of client.commands.values()) commands.push(cmd.data.toJSON());

  try {
    const { guildid } = require('./config.json');
    if (guildid) {
      const guild = await client.guilds.fetch(guildid).catch(() => null);
      if (guild) {
        await guild.commands.set(commands);
        console.log('Registered guild commands');
      } else {
        await client.application.commands.set(commands);
        console.log('Registered global commands fallback');
      }
    } else {
      await client.application.commands.set(commands);
      console.log('Registered global commands');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.login(TOKEN).catch(err => {
  console.error('Failed to login:', err);
  process.exit(1);
});