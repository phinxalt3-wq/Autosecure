module.exports = (address) => {
    const legacyLTCRegex = /^(L|M)[a-zA-Z0-9]{26,33}$|^3[a-zA-Z0-9]{1,32}$/;
    const bech32LTCRegex = /^(ltc1)[a-z0-9]{39,59}$/;
    return legacyLTCRegex.test(address) || bech32LTCRegex.test(address);
}