const axios = require("axios");
module.exports = async (amrp, amsc) => {
  const startTime = Date.now();
  try {
    const uatRequest = await axios({
      method: "GET",
      url: "https://account.live.com/consent/Manage?guat=1",
      headers: {
        Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc}`
      }
    });

    const clientIdRegex = /data-clientid="([^"]+)"/gi;
    let clientIds = [];
    let match;
    while ((match = clientIdRegex.exec(uatRequest.data)) !== null) {
      clientIds.push(match[1]);
    }

  

    await Promise.all(clientIds.map(removeClientId));
    return clientIds.length;
  } catch {
    return 0;
  }
};
