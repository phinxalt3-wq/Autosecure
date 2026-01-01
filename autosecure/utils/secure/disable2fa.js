const axios = require('axios');
const decode = require('./decode');
module.exports = async function disable2fa(amrp, amsc, apiCanary) {
  try {
    console.time('disable2fa');
    

    const removed = null;
    const { data: disabledata } = await axios({
      method: 'POST',
      url: 'https://account.live.com/API/Proofs/DisableTfa',
      headers: {
        cookie: `amsc=${amsc}; AMRPSSecAuth=${amrp};`,
        'Content-type': 'application/json; charset=utf-8',
        canary: apiCanary,
      },
      maxRedirects: 0,
      data: {
        scid: 100109,
        uaid: '985d9ef8f4d240e0b143cdcdb01b0688',
        uiflvr: 1001,
        hpgid: 201030,
      },
    });
    
    const tfaDisabled = !!disabledata?.apiCanary;
    if (tfaDisabled) {
      console.log('2FA successfully disabled.');
    } else {
      console.log("Couldn't disable 2FA!");
    }
    
    console.timeEnd('disable2fa');
    return { appPasswordsRemoved: removed, tfaDisabled };  
  } catch (error) {
    console.error('Error while disabling 2FA:', error.message);
    console.timeEnd('disable2fa');
    return { appPasswordsRemoved: null, tfaDisabled: false };
  }
};