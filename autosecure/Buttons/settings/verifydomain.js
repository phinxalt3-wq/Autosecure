const { queryParams } = require("../../../db/database");
const dns = require("dns").promises;
const config = require('../../../config.json');

module.exports = {
    name: "dns",
    userOnly: true,
    callback: async (client, interaction) => {
        const [_, vpsip, domain] = interaction.customId.split("|");


        const dnsCheck = await verifyDnsSetup(domain, vpsip);
        if (!dnsCheck.success) {
            return interaction.update({
                content: `DNS setup is incorrect:\n${dnsCheck.message} (This util is broken i think)`,
                ephemeral: true
            });
        }




        return interaction.update({
            content: `The setup for ${domain} is now verified and you should be able to get emails soon!`,
            ephemeral: true
        });
    }
};


const verifyDnsSetup = async (domain, vpsip) => {
    let errors = [];


    try {
        const aRecords = await dns.resolve(domain, "A");
        if (!aRecords.includes(vpsip)) {
            errors.push(`A Record: The IP address (${vpsip}) is not set for the domain.`);
        }
    } catch (err) {
        errors.push(`A Record: Failed to resolve or no A record found for ${domain}.`);
    }


    try {
        const mxRecords = await dns.resolveMx(domain);
        const expectedMx = domain; 
        if (!mxRecords.some(record => record.exchange === expectedMx)) {
            errors.push(`MX Record: The MX record for ${domain} is not correctly set.`);
        }
    } catch (err) {
        errors.push(`MX Record: Failed to resolve or no MX record found for ${domain}.`);
    }


    if (errors.length > 0) {
        return {
            success: false,
            message: errors.join("\n") 
        };
    }

    return { success: true };
};