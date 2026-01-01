const { queryParams } = require("../../db/database");

let quarantineMap = new Map();

/**
 * Initialize quarantine system by loading all quarantined sessions from database
 * and adding them to the map
 */
async function initializequarantine() {
  try {
    const rows = await queryParams("SELECT * FROM quarantine", []);
    console.log(`Starting ${rows.length} quarantined sessions from database`);

    for (const row of rows) {
      quarantineMap.set(row.id, {
        username: row.name,
        uuid: row.uuid,
        ssid: row.ssid
      });
    }

    const { startnewbots } = require('./quarantinehandler');
    await startnewbots();

    const { checkexpiredq } = require('./quarantinehandler');
    await checkexpiredq();

    console.log("Quarantine system initialized successfully");
  } catch (err) {
    console.error("Error initializing quarantine:", err);
  }
}

module.exports = {
  quarantineMap,
  initializequarantine
};
