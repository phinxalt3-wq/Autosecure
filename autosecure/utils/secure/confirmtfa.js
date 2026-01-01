const decode = require('./decode');

module.exports = async function confirmtfa(axios, code, proof, rvtkn, apiCanary) {
  const decodedr = decodeURIComponent(rvtkn);

  try {
    const requestData = {
      ProofId: proof,
      TotpCode: code,
      uiflvr: 1001,
      uaid: "b98750aea5644a548609bbcbfab874cb",
      scid: 100109,
      hpgid: 200335
    };

    const response = await axios.post('https://account.live.com/API/AddVerifyTotp', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'canary': apiCanary,
        'hpgid': '200335',
        'scid': '100109',
        'uiflvr': '1001',
        'uaid': 'b98750aea5644a548609bbcbfab874cb'
      }
    });

    if (!response.data?.apiCanary) {
      return 'retry';
    }

    // Attempt with proxy first
    const tryWithProxy = async () => {
      try {
        const tfarequest = await axios.post(
          `https://account.live.com/proofs/EnableTfa?mkt=en-gb&uaid=d7559d7e02fb4eaf87e688212916f5c4&rvtkn=${decodedr}`,
          null,
          {
            proxy: true 
          }
        );
        return tfarequest;
      } catch (error) {
        throw new Error('Proxy request failed');
      }
    };


    let retries = 3;
    let tfarequest;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        tfarequest = await tryWithProxy();
        if (tfarequest.status === 200) {
          return true;
        }
      } catch (error) {
        if (attempt === retries) {
          console.log('Max retries reached. Attempting without proxy...');
          break;
        }
        console.log(`Retry ${attempt} failed with proxy. Retrying...`);
      }
    }


    const tfarequestWithoutProxy = await axios.post(
      `https://account.live.com/proofs/EnableTfa?mkt=en-gb&uaid=d7559d7e02fb4eaf87e688212916f5c4&rvtkn=${decodedr}`,
      null,
      {
        headers: {
          'Content-Type': 'application/json',
          'canary': apiCanary,
          'hpgid': '200335',
          'scid': '100109',
          'uiflvr': '1001',
          'uaid': 'b98750aea5644a548609bbcbfab874cb'
        }
      }
    );

    if (tfarequestWithoutProxy.data?.error) {
      return false;
    }

    if (tfarequestWithoutProxy.status === 200) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error during TFA confirmation:', error);
    return false;
  }
};
