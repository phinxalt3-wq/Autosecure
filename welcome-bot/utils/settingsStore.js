const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'settings.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      welcomechannel TEXT,
      leavechannel TEXT,
      memberrole TEXT,
      buychannels TEXT,
      welcome_enabled INTEGER DEFAULT 1,
      leave_enabled INTEGER DEFAULT 1
    )`);
  });
}

function setSetting(guildId, key, value) {
  return new Promise((resolve, reject) => {
    init();
    const validKeys = ['welcomechannel','leavechannel','memberrole','buychannels','welcome_enabled','leave_enabled'];
    if (!validKeys.includes(key)) return reject(new Error('Invalid key'));
    const stmt = `INSERT INTO guild_settings (guild_id, ${key}) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET ${key}=excluded.${key}`;
    db.run(stmt, [guildId, value], function(err) {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

function getSettings(guildId) {
  return new Promise((resolve, reject) => {
    init();
    db.get(`SELECT * FROM guild_settings WHERE guild_id = ?`, [guildId], (err, row) => {
      if (err) return reject(err);
      if (!row) {
        return resolve({
          guild_id: guildId,
          welcomechannel: null,
          leavechannel: null,
          memberrole: null,
          buychannels: null,
          welcome_enabled: 1,
          leave_enabled: 1
        });
      }
      resolve(row);
    });
  });
}

module.exports = { init, setSetting, getSettings };
