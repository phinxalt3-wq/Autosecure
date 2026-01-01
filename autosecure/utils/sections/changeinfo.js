const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const FormData = require("form-data");
const { getname, getdobregion, updateExtraInformation, isUrl } = require('../process/helpers');
const changename = require("../changeinfo/changename");
const changedobregion = require("../changeinfo/changedobregion");
const changelanguage = require("../changeinfo/changelanguage");

async function changeinfo(uid, settings, axios, amc, jwt, verificationtoken) {
    const changedinfo = {
        firstname: null,
        lastname: null,
        dob: null,
        country: null,
        language: null
    };

    const promises = [];

    if (settings.changename) {
        promises.push((async () => {
            const name = settings.name ? `${settings.name}` : getname();
            const newname = await changename(axios, name);
            if (newname) {
                changedinfo.firstname = name.split("|")[0];
                changedinfo.lastname = name.split("|")[1];
            } else {
                changedinfo.firstname = "Failed!";
                changedinfo.lastname = "Failed!";
            }
        })());
    } else {
        changedinfo.firstname = "Option is off.";
        changedinfo.lastname = "Option is off.";
    }

    if (settings.changedob) {
        promises.push((async () => {
            const dob = settings.dob ? `${settings.dob}` : getdobregion();
            const dobchanged = await changedobregion(axios, dob);
            if (dobchanged) {
                const [day, month, year, iso] = dob.split("|");
                changedinfo.dob = `${day}|${month}|${year}`;
                changedinfo.country = iso;
            } else {
                changedinfo.dob = "Failed!";
                changedinfo.country = "Failed!";
            }
        })());
    } else {
        changedinfo.dob = "Option is off.";
        changedinfo.country = "Option is off.";
    }

    if (settings.changelanguage) {
        promises.push((async () => {
            const lang = settings.language ? settings.language : 'en-US';
            const langchanged = await changelanguage(axios, lang);
            if (langchanged) {
                changedinfo.language = lang;
            } else {
                changedinfo.language = "Failed!";
            }
        })());
    } else {
        changedinfo.language = "Option is off.";
    }

    await Promise.all(promises);

    console.log(`Setting to ${JSON.stringify(changedinfo)}`);
    await updateExtraInformation(uid, "newinfo", JSON.stringify(changedinfo));
}

module.exports = changeinfo;
