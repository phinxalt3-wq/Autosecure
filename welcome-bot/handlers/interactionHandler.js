const fs = require('fs');
const path = require('path');

function setupInteractionHandler(client) {
  client.commands = new Map();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    client.commands.set(cmd.data.name, cmd);
  }

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error('Command error:', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error running command', ephemeral: true });
    }
  });
}

module.exports = { setupInteractionHandler };
