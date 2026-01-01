const https = require('https');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); // ✅ FIXED

module.exports = async function checklocked(email) {
  const config = require('../../../config.json');

  async function makeRequestWithProxy(retries = 3) {
    const proxies = Array.isArray(config.proxy) ? config.proxy : [config.proxy];
    let lastError = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      let proxyAgent = null;
      
      // Use proxy if enabled
      if (config.useproxy === true || config.useproxy === "true") {
        if (proxies.length > 0 && proxies[0]) {
          const proxy = proxies[Math.floor(Math.random() * proxies.length)];
          const [PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS] = proxy.split(':');
          const proxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`;
          proxyAgent = new HttpsProxyAgent(proxyUrl);
          console.log(`🔍 Checking account lock status using proxy: ${PROXY_HOST}:${PROXY_PORT}`);
        }
      }

      try {
        const requestConfig = {
          headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
            'Host': 'support.microsoft.com',
            'Content-Type': 'application/json'
          },
          decompress: true,
          validateStatus: () => true,
          timeout: 10000
        };

        if (proxyAgent) {
          requestConfig.httpsAgent = proxyAgent;
        }

        const res = await axios.post(
          'https://support.microsoft.com/nl-NL/api/contactus/v1/ExecuteAlchemySAFAction?SourceApp=soc2',
          {
            Locale: 'nl-NL',
            Parameters: {
              emailaddress: email
            },
            ActionId: 'signinhelperemailv2',
            CorrelationId: '1b846a60-a752-45ee-95cb-b3ddd5b0bacd',
            ContextVariables: [],
            V2: true  
          },
          requestConfig
        );

        return res;

      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt + 1} failed: ${error.message}`);
        
        if (attempt < retries - 1) {
          console.log('🔄 Retrying with different proxy...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  }

  try {
    const res = await makeRequestWithProxy();


    if (!res.data || !res.data.Value) {
      return {
        locked: "error",
        reason: "Invalid response"
      };
    }

   console.log(`Res data: ${JSON.stringify(res.data)}`)

    const parsed = JSON.parse(res.data.Value);
    const status = parsed.status || {};

return {
  locked: status.isAccountSuspended,
  compromised: status.isAccountCompromised,
  blocked: status.isAccountBlocked,
  tsvEnabled: status.tsvEnabled,
  active: status.isAccountActive,
  emailVerified: status.isEmailVerified,
  reason: status.reasonForAccountSuspension
    ? status.reasonForAccountSuspension
    : "Nothing found."
};

  } catch (err) {
    console.log(`❌ Error in checklocked.js: ${err.message}`);
    
    // If all proxies failed, try without proxy as fallback
    if (config.useproxy === true || config.useproxy === "true") {
      console.log('🔄 All proxies failed, trying without proxy...');
      try {
        const res = await axios.post(
          'https://support.microsoft.com/nl-NL/api/contactus/v1/ExecuteAlchemySAFAction?SourceApp=soc2',
          {
            Locale: 'nl-NL',
            Parameters: {
              emailaddress: email
            },
            ActionId: 'signinhelperemailv2',
            CorrelationId: '1b846a60-a752-45ee-95cb-b3ddd5b0bacd',
            ContextVariables: [],
            V2: true  
          },
          {
            headers: {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
              'Host': 'support.microsoft.com',
              'Content-Type': 'application/json'
            },
            decompress: true,
            validateStatus: () => true,
            timeout: 10000
          }
        );

        if (res.data && res.data.Value) {
          const parsed = JSON.parse(res.data.Value);
          const status = parsed.status || {};

          return {
            locked: status.isAccountSuspended,
            compromised: status.isAccountCompromised,
            blocked: status.isAccountBlocked,
            tsvEnabled: status.tsvEnabled,
            active: status.isAccountActive,
            emailVerified: status.isEmailVerified,
            reason: status.reasonForAccountSuspension || "Nothing found."
          };
        }
      } catch (fallbackErr) {
        console.log(`❌ Fallback also failed: ${fallbackErr.message}`);
      }
    }

    return {
      locked: "error",
      reason: "Failed to check account status - all connection attempts failed"
    };
  }
}


