Welcome-bot
===========

Standalone Discord welcome/leave bot extracted from Autosecure.

Setup

1. Copy `config.json.example` to `config.json` and fill in `guildid`, `welcomechannel`, `memberrole`, and optionally `buyChannels`.
2. Copy `.env.example` to `.env` and set your `TOKEN`.
3. Install dependencies and start:

```bash
cd welcome-bot
npm install
npm start
```

Behavior

- On startup, the bot caches guild invites to track which invite a new member used.
- On `guildMemberAdd`, it sends a welcome embed to `welcomechannel`, assigns `memberrole` (if set), and mentions configured buy channels.
- On `guildMemberRemove`, it sends a leave embed to `welcomechannel`.

Slash Commands

- `/config show` — Display current guild settings.
- `/config set <key> <value>` — Set configuration values (keys: `welcomechannel`, `leavechannel`, `memberrole`, `buychannels`, `welcome_enabled`, `leave_enabled`).
- `/config test <welcome|leave>` — Send a test message to the configured channel.
- `/ping` — Test bot latency.
- `/botinfo` — Show basic info about the bot.

Notes

- The handler optionally restricts to a `guildid` if set; leave empty or remove the check to make it work across guilds.
- This bot uses `discord.js` v14 and requires `Guilds`, `GuildMembers`, and `GuildInvites` intents.