function checkmc(mc) {
    if (mc === "Purchased" || mc === "True (Source: N/A)" || mc === "Gamepass") {
        return true;
    }
    return false;
}

module.exports = checkmc;


// Maybe add  || mc === "Maybe (dm david asap)"