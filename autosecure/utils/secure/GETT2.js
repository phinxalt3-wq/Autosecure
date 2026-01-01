const axios = require("axios");

module.exports = async function getT2(msauth, amsc) {


  let fetchT = await axios({
    method: "GET",
    url: `https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=170&checkda=1&rver=7.5.2112.0&wp=MBI_SSL&wreply=https:%2F%2Faccount.microsoft.com%2Fauth%2Fcomplete-silent-signin%3Fru%3Dhttps%3A%2F%2Faccount.microsoft.com%2F%3Flang%3Dfr-FR%26refd%3Daccount.live.com%26refp%3Dlanding%26mkt%3DFR-FR&lc=1036&id=292666`,
    headers: {
      cookie: `__Host-MSAAUTH=${msauth}; amsc=${amsc}`,
    },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  let match = fetchT.data.match(/<input\s+type="hidden"\s+name="t"\s+id="t"\s+value="([^"]+)"\s*\/?>/);

  if (fetchT.data.includes("Abuse")) {
    return `locked`;
  } else if (fetchT.data.includes("working to restore all services")) {
    return `down`;
  }
  if (match && match[1]) {

    return match[1];
  } else {
    return null;
  }
};