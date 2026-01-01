    const { updateExtraInformation } = require("../../process/helpers");
    const getAliases = require("../getAliases");
    const getoauths = require("../getoauths");

    module.exports = async function newinfo(axios, uid) {
        let newinfo = { 
            newprimary: null,
            oauths: null
        };

        let promises = [];

        promises.push((async () => {
            let newa = await getAliases(axios);

            if (!Array.isArray(newa) || newa.length < 3) return;

            let [newaliases, ncanary, nprimary] = newa;

            if (newaliases !== null && newaliases !== undefined) {
                await updateExtraInformation(uid, "newaliases", JSON.stringify(newaliases));
            }
            if (nprimary) {
                newinfo.newprimary = nprimary;
            }
        })());

        promises.push((async () => {
            try {
                let oauthdata = await getoauths(axios);
                await updateExtraInformation(uid, "oauthsafter", JSON.stringify(oauthdata || []));
                newinfo.oauths = oauthdata;
            } catch (error) {
                console.log(error);
            }
        })());

        await Promise.all(promises);

        return newinfo;
    }
