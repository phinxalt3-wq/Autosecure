const generate = require("../../generate");
const { domains } = require("../../../../config.json");

module.exports = async function getsecureinfo(settings) {
    const prefix = settings?.prefix || "old";
    const domain = settings?.domain || domains[0];
    const secEmail = `${prefix}${generate(12)}@${domain}`;
    const password = generate(16);
    return { secEmail, password };
};
