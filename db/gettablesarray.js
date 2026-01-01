// Show only allowed tables to users, and only allow these tables to be loaded using /config load, to prevent SQL abuse.

function tablesforuser() {
    return [
        "autosecure", "profiles", "embeds", "modals", "buttons", 
        "users", "email_notifier", "blacklisted", "blacklistedemails",
        "quarantine", "registeredemails", "accountsbyuser", "presets", 
        "unclaimed", "proxies", "settings", "secureconfig"
    ];
}

// bot specific tables
function tablesbotnumber(){
    return [
        "autosecure", "profiles", "embeds", "modals", "buttons", 
        "users", "blacklisted", "presets", "unclaimed", "blacklistedemails"
    ];
}

function tablesclientid(){
    return [
        "blacklisted", "blacklistedemails"
    ];
}

/// Only change for /recover from user to user and besides that keep these tables behind the scenes basically. 
/// accounts is just a backup, accountsbyuser actually decides the user's accounts.
/// The other tables are not needed to transfer and are temporary.
function tablesfortransfer(){
    return [    
        "usedLicenses", "trial", "accounts", "leaderboard", "slots"
    ];    
}

function tablestheycanhave(){
    return [
        "trial", "slots"
    ];
}

module.exports = { 
    tablesforuser, 
    tablesfortransfer, 
    tablesbotnumber, 
    tablesclientid, 
    tablestheycanhave 
};